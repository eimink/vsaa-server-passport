#!/bin/bash

echo "vsaa-server-nodejs quick setup"

hash node 2>/dev/null || { echo >&2 "Node.js not installed, aborting..."; exit 1; }
hash npm 2>/dev/null || { echo >&2 "NPM not found, aborting..."; exit 1; }

echo -n "Listen to port >"
read port
re='^[0-9]+$'
if ! [[ $port =~ $re ]] ; then
   echo "error: Not a valid port number" >&2; port=8080
fi

echo "What database are you using?"
echo "1) MySQL (default)"
echo "2) MongoDB"
echo "3) MSSQL"
echo -n "> "
read dbselection

echo -n "Database server address > "
read dbsrvaddr

echo -n "Database user > "
read dbsrvuser

echo -n "Database password > "
read dbsrvpwd

echo -n "Database name > "
read dbname

echo "Updating config..."

if [ $dbselection -eq 2 ]; then 
	dbdriver=mongodb
	dbmodule=mongojs
	dburi="$dbsrvuser:$dbsrvpwd@$dbsrvaddr/$dbname"
	perl -pi -e "s/mongodb_uri.*,/mongodb_uri : \"$dburi\",/" config.js
elif [ $dbselection -eq 3 ]; then 
	dbdriver=mssql
	dbmodule=mssql
	perl -pi -e "s/server.*,/server : \"$dbsrvaddr\",/" config.js
else 
	dbdriver=mysql
	dbmodule=mysql
fi

perl -pi -e "s/db_driver.*,/db_driver : \"$dbmodule\",/" config.js
perl -pi -e "s/user.*,/user : \"$dbsrvuser\",/" config.js
perl -pi -e "s/password.*,/password : \"$dbsrvpwd\",/" config.js
perl -pi -e "s/host.*,/host : \"$dbsrvaddr\",/" config.js
perl -pi -e "s/database :.*,/database : \"$dbname\",/" config.js
perl -pi -e "s/listen :.*,/listen : $port,/" config.js

echo "Installing node modules..."
sudo npm install restify passport underscore crypto sharedmemory $dbmodule

echo "You're all set! Make sure you have prepared the database as described in schema/$dbmodule.md"


