@echo off
REM Check if Python 3 is installed
python --version 2>NUL | findstr /R /C:"^Python 3" >nul
IF ERRORLEVEL 1 (
    echo Python 3 is not installed. Please install it before running this script.
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo pip is not installed. Installing pip...
    python -m ensurepip --upgrade
)

REM Check if virtualenv is installed
python -m pip show virtualenv >nul 2>&1
IF ERRORLEVEL 1 (
    echo Installing virtualenv...
    python -m pip install virtualenv
)

REM Create virtual environment if it doesn't exist
IF NOT EXIST "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate the virtual environment
echo Activating the virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
IF EXIST .env (
    echo .env file found.
) ELSE (
    echo .env file not found. Please ensure it exists with the necessary environment variables \(e.g., OPENAI_API_KEY\).
)

REM Run the Flask server
echo Starting the Flask server...
python server.py
