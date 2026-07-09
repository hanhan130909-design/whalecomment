$electron = "D:\金主项目\WhaleSense_Windows\WhaleSense_Windows\desktop-app\node_modules\electron\dist\electron.exe"
$app = "D:\自动化评论软件\desktop_app"
Start-Process -FilePath $electron -ArgumentList $app
