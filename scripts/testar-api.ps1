param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Email,
    [string]$Senha
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd('/')
if ([string]::IsNullOrWhiteSpace($Email) -or [string]::IsNullOrWhiteSpace($Senha)) {
    throw "Informe -Email e -Senha de uma conta que recebeu o papel ADMIN no PostgreSQL."
}

Write-Host "[1/4] Verificando catálogo público..."
$publicProducts = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/produtos"
if ($null -eq $publicProducts) { throw "A API pública não retornou uma lista." }
Write-Host "  OK — $($publicProducts.Count) produto(s) ativo(s) retornado(s)."

Write-Host "[2/4] Autenticando a conta administradora..."
$body = @{ email = $Email; senha = $Senha } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $body
if ([string]::IsNullOrWhiteSpace($login.accessToken)) { throw "Login não retornou accessToken." }
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
Write-Host "  OK — token recebido."

Write-Host "[3/4] Consultando catálogo administrativo..."
$adminProducts = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/produtos" -Headers $headers
Write-Host "  OK — $($adminProducts.Count) produto(s) no catálogo administrativo."

Write-Host "[4/4] Confirmando proteção da rota administrativa..."
$blocked = $false
try {
    Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/produtos" | Out-Null
} catch {
    $status = [int]$_.Exception.Response.StatusCode
    if ($status -eq 401 -or $status -eq 403) { $blocked = $true }
}
if (-not $blocked) { throw "A rota administrativa respondeu sem token; confira a configuração de segurança." }
Write-Host "  OK — acesso sem token bloqueado."

Write-Host "\nTodos os testes básicos passaram. Para validar cadastro/edição/status, siga o roteiro em docs/API.md."
