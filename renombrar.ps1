Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    $newName = $_.FullName.ToLower()
    if($_.FullName -ne $newName){
        Rename-Item -Path $_.FullName -NewName $newName -Force
    }
}