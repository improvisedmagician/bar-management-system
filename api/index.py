import sys
import os

# Adiciona a pasta backend ao path para os imports locais do FastAPI funcionarem
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
