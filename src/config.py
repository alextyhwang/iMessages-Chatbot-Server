import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MODE = os.getenv('MODE', 'chatbot').lower()
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    POLL_INTERVAL = float(os.getenv('POLL_INTERVAL', '0.5'))
    MESSAGE_HISTORY_LIMIT = int(os.getenv('MESSAGE_HISTORY_LIMIT', '20'))
    CHAT_DB_PATH = os.path.expanduser('~/Library/Messages/chat.db')
    LOCAL_DB_PATH = 'conversation_state.db'
    MAX_CONCURRENT_REQUESTS = 20
    APPLESCRIPT_RETRY_COUNT = 3
    APPLESCRIPT_RETRY_DELAY = 1
    ENABLE_TYPING_INDICATOR = os.getenv('ENABLE_TYPING_INDICATOR', 'true').lower() == 'true'
    PRESENCE_ONLY_MODES = {'presence-only', 'presence_only', 'presence'}
    IS_PRESENCE_ONLY = MODE in PRESENCE_ONLY_MODES
    
    @classmethod
    def validate(cls):
        if cls.MODE not in cls.PRESENCE_ONLY_MODES and cls.MODE not in {'chatbot', 'demo', 'standalone'}:
            raise ValueError("MODE must be one of: chatbot, demo, standalone, presence-only")

        if cls.IS_PRESENCE_ONLY:
            return True

        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        if cls.POLL_INTERVAL <= 0:
            raise ValueError("POLL_INTERVAL must be positive")
        if cls.MESSAGE_HISTORY_LIMIT < 0:
            raise ValueError("MESSAGE_HISTORY_LIMIT must be non-negative")
        
        return True
