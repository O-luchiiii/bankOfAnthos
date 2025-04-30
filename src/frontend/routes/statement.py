import os
import json
import requests
from flask import Blueprint, request, jsonify, Response

statement_bp = Blueprint('statement', __name__)

# External API endpoint for statements
EXTERNAL_STATEMENT_API = os.environ.get('EXTERNAL_STATEMENT_API', 'https://pdfgen-766109226341.us-central1.run.app')

@statement_bp.route('/statement', methods=['POST'])
def generate_statement():
    """Generate a bank statement by sending transaction data to an external API.
    Returns the PDF directly to force a download in the browser.
    """
    try:
        # Get the statement data from the request
        statement_data = request.get_json()
        
        # Validate required fields
        required_fields = ['customerName', 'accountNumber', 'date', 'statementPeriod', 'transactions']
        for field in required_fields:
            if field not in statement_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Send data to external API
        response = requests.post(
            f'{EXTERNAL_STATEMENT_API}/statement',
            json=statement_data,
            headers={'Content-Type': 'application/json'},
            stream=True  # Stream the response to handle binary data
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            # Get the PDF content from the response
            pdf_content = response.content
            
            # Generate a filename based on account number and date
            filename = f"statement_{statement_data['accountNumber']}_{statement_data['date']}.pdf"
            
            # Return the PDF file as an attachment to force download
            return Response(
                pdf_content,
                mimetype='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'application/pdf'
                }
            )
        else:
            return jsonify({
                'success': False, 
                'message': 'Failed to generate statement',
                'error': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500