import sys
import os

# Adiciona a pasta backend ao path (tentando tanto na raiz quanto um nível acima)
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main import app
