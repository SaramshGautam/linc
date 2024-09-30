if ! command -v python3 &> /dev/null
then
    echo "Python 3 is not installed. Please install it before running this script."
    exit 1
fi

if ! command -v pip &> /dev/null
then
    echo "pip is not installed. Installing pip..."
    sudo apt install python3-pip -y
fi

if ! python3 -m pip show virtualenv &> /dev/null
then
    echo "Installing virtualenv..."
    python3 -m pip install virtualenv
fi

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating the virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set environment variables from .env (ensure .env file exists)
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found. Please ensure it exists with the necessary environment variables (e.g., OPENAI_API_KEY)."
    exit 1
fi

# Run the Flask server
echo "Starting the Flask server..."
python server.py

