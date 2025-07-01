from app import create_app, db
from flask import send_from_directory

app = create_app()

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('/app/Client/dist/assets', filename)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()