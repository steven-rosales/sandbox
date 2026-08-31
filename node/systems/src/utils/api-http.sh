TENANT_ID='11111111-1111-4111-8111-111111111111'
CUSTOMER_ID='22222222-2222-4222-8222-222222222222'

curl -i -X POST http://127.0.0.1:8080/orders \
  -H "content-type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "idempotency-key: order-request-002" \
  -d @- <<EOF 
{
  "customerId": "$CUSTOMER_ID",
  "amountCents": 7500
}
EOF
