___First setting up venv___
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt --no-deps

___Activate/deactivate venv___
source .venv/bin/activate
deactivate