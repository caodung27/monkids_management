"""
Test OAuth Redirect Script

This script simulates the OAuth login redirect by generating a page
with tokens to test the frontend callback and dashboard functionality.
"""

import os
import sys
import json
import datetime
import jwt
from http.server import HTTPServer, BaseHTTPRequestHandler

# Sample tokens for testing
ACCESS_TOKEN = jwt.encode(
    {
        "token_type": "access",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
        "iat": datetime.datetime.utcnow(),
        "jti": "abcdef123456",
        "user_id": "1"
    },
    "test_secret_key",
    algorithm="HS256"
)

REFRESH_TOKEN = jwt.encode(
    {
        "token_type": "refresh",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow(),
        "jti": "refresh123456",
        "user_id": "1"
    },
    "test_secret_key",
    algorithm="HS256"
)

class OAuthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request and redirect with tokens"""
        if self.path.startswith('/oauth'):
            self.send_response(302)  # Redirect
            redirect_url = f"http://localhost:3000/auth/callback?access_token={ACCESS_TOKEN}&refresh_token={REFRESH_TOKEN}&user_id=1"
            self.send_header('Location', redirect_url)
            self.end_headers()
        else:
            # Serve a simple HTML page with link to trigger the OAuth flow
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = f"""
            <html>
            <head><title>Test OAuth Redirect</title></head>
            <body>
                <h1>Test OAuth Login</h1>
                <p>Click the button below to simulate OAuth login with tokens:</p>
                <a href="/oauth" style="padding: 10px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">
                    Login with OAuth
                </a>
                <hr/>
                <h2>Test Tokens</h2>
                <pre>Access Token: {ACCESS_TOKEN}</pre>
                <pre>Refresh Token: {REFRESH_TOKEN}</pre>
                <p>Test direct redirection with these tokens:</p>
                <a href="http://localhost:3000/auth/callback?access_token={ACCESS_TOKEN}&refresh_token={REFRESH_TOKEN}&user_id=1" 
                   style="padding: 10px; background: #34a853; color: white; text-decoration: none; border-radius: 4px;">
                    Redirect to Callback with Tokens
                </a>
            </body>
            </html>
            """
            self.wfile.write(html.encode())

def run(server_class=HTTPServer, handler_class=OAuthHandler, port=8080):
    """Run the test OAuth server"""
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting OAuth test server at http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        run(port=int(sys.argv[1]))
    else:
        run() 