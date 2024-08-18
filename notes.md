## Handle email change flow

1. User request for email change - provides old email and new email.
2. Generate otp and store otp and new email to the table.
3. After verification of the otp - use that otp and current email address to validate the otp.
4. Find otp doc from the table via otp
5. Validate the otp with callers email address and operation.
6. If validation successful then perform the operation.

## API Testing

1. Test if deleting users **from query** is deleting all the sessions and todos or not

## Client

1. Have a user store where user details such as name and email is stored - useful for calling different APIs.
