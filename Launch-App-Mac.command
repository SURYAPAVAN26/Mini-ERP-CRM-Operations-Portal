#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "========================================================"
echo "NEXUS OPERA | Wholesale ERP & CRM Operations Portal"
echo "Launching server on macOS..."
echo "========================================================"

cd "$DIR/backend"
open "http://localhost:5000/"
npm start
