from fastapi import APIRouter, UploadFile, File, HTTPException
import logging
import speech_recognition as sr
import tempfile
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using Google Speech Recognition.
    Accepts WAV audio files and returns transcribed text.
    """
    # Accept WAV files and also allow application/octet-stream (browser may send this)
    allowed_types = ("audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave", "application/octet-stream")
    
    if file.content_type and file.content_type not in allowed_types:
        logger.warning(f"Unexpected content type: {file.content_type}, proceeding anyway")
        # Don't reject immediately - some browsers send incorrect content-type
    
    recognizer = sr.Recognizer()
    temp_path = None

    try:
        # Read file contents
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        logger.info(f"Received audio file: {len(contents)} bytes, content-type: {file.content_type}")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_path = temp_file.name
            temp_file.write(contents)
            temp_file.flush()
        
        # Adjust for ambient noise and record audio
        with sr.AudioFile(temp_path) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            # Record the audio
            audio = recognizer.record(source)
        
        logger.info("Attempting to recognize speech...")
        
        # Recognize speech using Google Speech Recognition
        try:
            transcript = recognizer.recognize_google(audio, language="en-US")
            logger.info(f"Transcription successful: {transcript}")
            return {"text": transcript, "status": "success"}
        except sr.UnknownValueError:
            logger.warning("Google Speech Recognition could not understand audio")
            raise HTTPException(
                status_code=400, 
                detail="Could not understand the audio. Please speak clearly and try again."
            )
        except sr.RequestError as exc:
            logger.error(f"Speech recognition service error: {exc}")
            raise HTTPException(
                status_code=503, 
                detail=f"Speech recognition service unavailable. Please check your internet connection and try again. Error: {str(exc)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during recognition: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred during speech recognition: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process audio file: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file: {e}")