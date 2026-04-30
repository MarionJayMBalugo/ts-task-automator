# Declare variables
$iniPath = "E:\tms-dos\resources\resources\www\Default\.env"
$ini = Get-Content $iniPath | % { $_ -replace '\\', '\\'} | Where-Object {$_ -match "="} | ConvertFrom-StringData
$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition         #This gets the current path of the script
$path = 'E:\tms-dos-data\apache-configuration\backups'                      # path of backup folder
$backupspath = 'E:\tms-dos-data\apache-configuration\backups'
$logFile = "mysql_backup.log"                                 # path of log file
$binpath = 'E:\tms-dos\resources\resources\mariadb\bin'       #path for mysql bin folder
$mysqldump = 'E:\tms-dos\resources\resources\mariadb\bin\mysqldump.exe'
$database = $ini.DB_NAME                                      # Database Name
$dw_database = $ini.DB_NAME + '_dw'                           # Datawarehouse database name
$user = $ini.DB_USERNAME                                      # username for MYSQL Connection
$password = $ini.DB_PASSWORD                                  # password for MYSQL Connection
$7zipPath = 'E:\tms-tools\7-Zip'                               

# get today's date to name today backup folder
$date = Get-Date -UFormat "%Y-%m-%d %R"
$day = Get-Date -Format "dddd"
$timestamp = Get-Date -Format "MM-dd-yyyy_HH_mm_ss"

If(!(test-path $backupspath))
{
      New-Item -ItemType Directory -Force -Path $backupspath
}

# Check for log file
# Create if not found
if (-NOT (Test-Path $logFile)) {
    #New-Item -Path $logpath -Name $logFile -ItemType "file"
    New-Item -ItemType File -Force -Name $logfile
    Add-Content $logFile "Created on: $date`n"
}

#Add-Content $logFile "[$date]: Deleting Backup Files older than 1 month"

#echo "would delete old files, here"
#Get-ChildItem -Path "$backupspath" -Recurse | Where-Object {($_.LastWriteTime -lt (Get-Date).AddDays(-30))} | Remove-Item

function logError($e)
{
    $date = Get-Date -UFormat "%Y-%m-%d %R"
    Add-Content $logFile "[$date]: Script Stack: "
    Add-Content $logFile $_.ScriptStackTrace
    Add-Content $logFile "[$date]: Exception: "
    Add-Content $logFile $_.Exception
    Add-Content $logFile "[$date]: Error Details: "
    Add-Content $logFile $_.ErrorDetails
}

Try{
if (-not (Test-Path -Path $mysqldump -PathType Leaf)) {
  throw "'$mysqldump' not found"
}
Set-Alias mysqldump $mysqldump
}Catch{
  logError($_);
}

$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: Starting mysqldump for $database"

Try{
mysqldump --user=$user --password="$password" $database --single-transaction --routines --triggers --events -r $path\$database-$day.sql
}
Catch{
    logError($_);
}
$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: Compressing $path\$database-$day.sql and creating $path\$database-$day.zip"
Try{
   &"$7zipPath\7z.exe" a "$path\$database-$day.zip" "$path\$database-$day.sql"
   # Compress-Archive -Force -Path $path\$database-$day.sql -DestinationPath $path\$database-$day
}
Catch{
    logError($_);
}
$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: Removing $path\$database-$day.sql"
Try{
    del $path\$database-$day.sql
}
Catch{
    logError($_);
}

$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: Starting mysqldump for $dw_database"

Try{
mysqldump --user=$user --password="$password" $dw_database --single-transaction --routines --triggers --events -r $path\$dw_database-$day.sql
}
Catch{
    logError($_);
}
$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content \$logFile "[$date]: Compressing $path\$dw_database-$day.sql and creating $path\$dw_database-$day.zip"
Try{
    &"$7zipPath\7z.exe" a "$path\$dw_database-$day.zip" "$path\$dw_database-$day.sql"
    # Compress-Archive -Force -Path $path\$dw_database-$day.sql -DestinationPath $path\$dw_database-$day
}
Catch{
    logError($_);
}
$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: Removing $path\$dw_database-$day.sql"
Try{
    del $path\$dw_database-$day.sql
}
Catch{
    logError($_);
}
$date = Get-Date -UFormat "%Y-%m-%d %R"
Add-Content $logFile "[$date]: All done"