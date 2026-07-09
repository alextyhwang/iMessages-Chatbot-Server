"""
Echo - iMessage AI Conversation Server

An asynchronous Python server that bridges Apple's iMessage with AI models,
plus a SIP-free presence sidecar (read receipts + typing) for OpenClaw and Hermes.
"""

__version__ = "1.0.0"
__author__ = "Echo Team"

from src.config import Config
from src.database import ConversationDatabase
from src.message_monitor import MessageMonitor
from src.ai_client import AIClient
from src.message_sender import MessageSender

__all__ = [
    'Config',
    'ConversationDatabase',
    'MessageMonitor',
    'AIClient',
    'MessageSender',
]

