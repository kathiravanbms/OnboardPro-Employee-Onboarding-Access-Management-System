param(
  [string]$Subject = "local.hr.manager@onboardpro.test",
  [string[]]$Roles = @("ROLE_HR_MANAGER"),
  [string]$UserId = "00000000-0000-0000-0000-000000000001",
  [string]$Secret = "change-this-production-secret-key-at-least-32-bytes-long",
  [int]$ExpiresInMinutes = 60
)

function ConvertTo-Base64Url {
  param([byte[]]$Bytes)
  [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

$now = [DateTimeOffset]::UtcNow
$header = @{
  alg = "HS256"
  typ = "JWT"
}
$payload = @{
  sub = $Subject
  user_id = $UserId
  roles = $Roles
  iat = $now.ToUnixTimeSeconds()
  exp = $now.AddMinutes($ExpiresInMinutes).ToUnixTimeSeconds()
  jti = [Guid]::NewGuid().ToString()
}

$jsonOptions = @{ Compress = $true }
$headerJson = $header | ConvertTo-Json @jsonOptions
$payloadJson = $payload | ConvertTo-Json @jsonOptions

$headerPart = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($headerJson))
$payloadPart = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($payloadJson))
$unsignedToken = "$headerPart.$payloadPart"

$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Secret))
$signature = ConvertTo-Base64Url ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsignedToken)))

"$unsignedToken.$signature"
