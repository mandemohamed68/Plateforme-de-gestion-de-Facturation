# -*- coding: utf-8 -*-
"""
Application de facturation avec gestion des utilisateurs et des droits.
Basée sur Flask, SQLAlchemy, JWT.
Fichier unique (tout-en-un) pour déploiement Python.
"""

import os
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity,
    create_refresh_token, set_access_cookies, set_refresh_cookies,
    unset_jwt_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Configuration Database & JWT
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'facturation_db')

app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-billing-pro')
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ------------------------------------------------------------
# Models SQLAlchemy
# ------------------------------------------------------------
res_groups_users_rel = db.Table(
    'res_groups_users_rel',
    db.Column('user_id', db.Integer, db.ForeignKey('res_users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('group_id', db.Integer, db.ForeignKey('res_groups.id', ondelete='CASCADE'), primary_key=True)
)

class ResGroup(db.Model):
    __tablename__ = 'res_groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ResUser(db.Model):
    __tablename__ = 'res_users'
    id = db.Column(db.Integer, primary_key=True)
    login = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('res_partner.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    groups = db.relationship('ResGroup', secondary=res_groups_users_rel, backref=db.backref('users', lazy='dynamic'))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class ResPartner(db.Model):
    __tablename__ = 'res_partner'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    is_company = db.Column(db.Boolean, default=True)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    vat = db.Column(db.String(50))
    customer_rank = db.Column(db.Integer, default=1)
    supplier_rank = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AccountMove(db.Model):
    __tablename__ = 'account_move'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    ref = db.Column(db.String(100))
    move_type = db.Column(db.String(30), nullable=False, default='out_invoice')
    state = db.Column(db.String(20), nullable=False, default='draft')
    partner_id = db.Column(db.Integer, db.ForeignKey('res_partner.id'), nullable=False)
    invoice_date = db.Column(db.Date, default=datetime.utcnow)
    invoice_date_due = db.Column(db.Date)
    amount_untaxed = db.Column(db.Numeric(12, 2), default=0.0)
    amount_tax = db.Column(db.Numeric(12, 2), default=0.0)
    amount_total = db.Column(db.Numeric(12, 2), default=0.0)
    amount_residual = db.Column(db.Numeric(12, 2), default=0.0)
    payment_state = db.Column(db.String(20), default='not_paid')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ------------------------------------------------------------
# API Routes (Prefix /api)
# ------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Python Flask Invoicing Backend"})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_val = data.get('login')
    password = data.get('password')

    user = ResUser.query.filter_by(login=login_val).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Identifiants invalides"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "login": user.login,
            "name": user.name,
            "email": user.email
        }
    })

@app.route('/api/partners', methods=['GET'])
def get_partners():
    partners = ResPartner.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "is_company": p.is_company,
        "email": p.email,
        "phone": p.phone,
        "vat": p.vat,
        "customer_rank": p.customer_rank,
        "supplier_rank": p.supplier_rank
    } for p in partners])

@app.route('/api/moves', methods=['GET'])
def get_moves():
    moves = AccountMove.query.all()
    return jsonify([{
        "id": m.id,
        "name": m.name,
        "ref": m.ref,
        "move_type": m.move_type,
        "state": m.state,
        "partner_id": m.partner_id,
        "amount_untaxed": float(m.amount_untaxed or 0),
        "amount_tax": float(m.amount_tax or 0),
        "amount_total": float(m.amount_total or 0),
        "amount_residual": float(m.amount_residual or 0),
        "payment_state": m.payment_state
    } for m in moves])

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
