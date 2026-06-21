from sqlalchemy.engine.url import make_url
from sqlalchemy import create_engine

url = "postgresql://postgres:hug$Y34DE%&yti@db.host.com/postgres"
print("URL parsing:")
try:
    u = make_url(url)
    print("Parsed successfully:", u.password)
except Exception as e:
    print("Error parsing:", repr(e))

print("Engine creation:")
try:
    engine = create_engine(url)
    print("Engine created successfully")
except Exception as e:
    print("Error creating engine:", repr(e))
