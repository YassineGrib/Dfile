// Windows Hello (fingerprint / face / Hello PIN) via the WinRT UserConsentVerifier API.
// Runs a PowerShell script passed with -EncodedCommand, so it also works from inside the packaged asar.
const { execFile } = require('child_process');

const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType = WindowsRuntime]
  $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation${'`'}1'
  } | Select-Object -First 1
  function Await($operation, [Type]$resultType) {
    $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $null = $task.Wait(-1)
    return $task.Result
  }
  if ('__ACTION__' -eq 'check') {
    $result = Await ([Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()) ([Windows.Security.Credentials.UI.UserConsentVerifierAvailability])
  } else {
    $result = Await ([Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('__MESSAGE__')) ([Windows.Security.Credentials.UI.UserConsentVerificationResult])
  }
  Write-Output $result.ToString()
} catch {
  Write-Output 'Error'
}
`;

function run(action, message = '') {
  if (process.platform !== 'win32') return Promise.resolve('Unsupported');

  // The message is shown in the Windows prompt; keep it to safe characters and escape PowerShell single quotes
  const safeMessage = String(message).replace(/[^\p{L}\p{N} .,!?-]/gu, '').slice(0, 120).replace(/'/g, "''");
  const script = SCRIPT.replace('__ACTION__', action).replace('__MESSAGE__', safeMessage);
  const encoded = Buffer.from(script, 'utf16le').toString('base64');

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { windowsHide: true, timeout: action === 'check' ? 15000 : 120000 },
      (err, stdout) => resolve(err ? 'Error' : String(stdout).trim() || 'Error')
    );
  });
}

/** 'Available' | 'DeviceNotPresent' | 'NotConfiguredForUser' | 'DisabledByPolicy' | 'DeviceBusy' | 'Unsupported' | 'Error' */
const checkAvailability = () => run('check');

/** 'Verified' | 'Canceled' | 'RetriesExhausted' | 'DeviceNotPresent' | 'NotConfiguredForUser' | 'DisabledByPolicy' | 'DeviceBusy' | 'Unsupported' | 'Error' */
const requestVerification = (message) => run('verify', message);

module.exports = { checkAvailability, requestVerification };
