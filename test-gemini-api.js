// Test script to verify Gemini API connection
// Run this in browser console to test your API key

async function testGeminiAPI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ VITE_GEMINI_API_KEY not found in environment variables');
    console.log('Please create a .env file with: VITE_GEMINI_API_KEY=your_api_key');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log('🧪 Testing API connection...');
    const result = await model.generateContent("Say 'API test successful!'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Test Successful!');
    console.log('Response:', text);
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.message.includes('404')) {
      console.log('💡 Solution: Model not found. Using correct model: gemini-pro');
    } else if (error.message.includes('403')) {
      console.log('💡 Solution: Check API key permissions in Google AI Studio');
    } else if (error.message.includes('401')) {
      console.log('💡 Solution: Verify your API key is correct');
    }
  }
}

// Run the test
testGeminiAPI();
