from marshmallow import fields, Schema


class ReceiptSchema(Schema):
    transaction_id = fields.String(required=True)
    date = fields.String(required=True)
    account = fields.String(required=True)
    amount = fields.Float(required=True)
    type = fields.String(required=False)
    label = fields.String(required=False)

schema = ReceiptSchema()