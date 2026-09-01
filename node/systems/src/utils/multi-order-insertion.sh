TENANT_ID='11111111-1111-4111-8111-111111111111'
CUSTOMER_ID='22222222-3333-4222-8222-222222222222'
TIMESTAMP=$(date +%s)

# If two dispatchers are started, it will most likely have one dispatcher process 8 orders while the other 4 orders. This is mainly due to concurrency being set to 4.
# This is mainly due to the polling timing (race condition of `sleep` when no events to claim) and `SKIP LOCKED` mechanics
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "Order $i: HTTP %{http_code}\n" -X POST http://127.0.0.1:8080/orders \
    -H "content-type: application/json" \
    -H "x-tenant-id: $TENANT_ID" \
    -H "idempotency-key: batch-${TIMESTAMP}-${i}" \
    -d "{
      \"customerId\": \"$CUSTOMER_ID\",
      \"amountCents\": $((5000 + i * 100))
    }" &
done

wait
echo "All 12 orders sent."