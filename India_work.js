
QA PORTAL = storeking , 321456 : Preprod Popup : storeking 543216

APP LOGIN ROBIN : 9020126869 , 12345 , Anne gowda : 8095188085/12345 - 8095188085/store@123

NEW APP LOGIN: 9740793973  654321 - F178192

Nagu : 8095188085/store@123

9742223860- harshitha@123 / 12345

9108884820

HARSHA APP LOGIN: 9538511123 , pwd = 9538511123 - "F102560"

http://localhost:49001/job/Raja-Sms/bitbucket-hook/
console.log("---object type--" , _order.constructor.name  , typeof _order);


http://www8.martjack.com/developerapi/swagger/ui/index#
-------------------------------------------------------------------------------
#. QA
	storeking
	321456
	user: storeking
	password : QA$Torek!nG@2019

-------------------------------------------------------------------------------
#.PRE-PROD
	User: storeking
	Password:$Torek!nG@2019



########################################################## CUSTOM GIT PLUGINS ##########################################################

"git+https://bitbucket.org/storekingdev/cache.git"

##########################################################--------MONGO DB-DUMP--------################################################################################
sudo systemctl start mongodb
sudo systemctl status mongodb

fuser -n tcp -k 9001 

sudo systemctl enable mongodb

Mongo db path : /var/lib/mongodb
mongo logs: /var/log/mongodb/mongod.log
mongo config : /etc/ vi mongod.conf

tail -f /var/log/mongodb/mongod.log
tail -n 100 /var/log/mongodb/mongod.log  - with lines no

check if a port is in use: sudo netstat -anp | grep ':80 '


QA DUMP COMMAND:
mongodump --db skDev -u qaReadUser -p RqtVVh3DgMZAEnU2 -h 13.126.75.175 -o /home/aman/Desktop

#LIVE:
	mongodump --db skstaging --collection stockledgers -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection omsmasters -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection warehouses -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection omsinvoices -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection stockintakes -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection stockadjustments -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop
	mongodump --db skstaging --collection stocktransfers -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop

	SSH TUNNEL:
	mongodump --db skstaging --collection omsinvoices -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h localhost --port 6161  -o /home/aman/Desktop/invoice-compare


	mongodump --db skstaging --collection warehouses -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 -o /home/aman/Desktop/Migration-Dump
	//Export CSV
	mongoexport --db skstaging --collection nstemplates -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 --type csv --fields name,address --noHeaderLine --out /home/aman/Desktop
	mongoexport --db skstaging --collection nstemplates -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 --type csv --fields _id,name,businessEntity,mode,isActive,default --noHeaderLine --out /home/aman/Desktop/nstemplates.csv
	mongoexport --db skstaging --collection nsevents -u skaman -p QdEN96NQMspbGDtXrHRWDQ -h 35.154.220.245 --type csv --fields _id,name,businessEntity,mode,isActive,rules --noHeaderLine --out /home/aman/Desktop/nsEvents.csv
	mongoexport --db sales --collection contacts --query '{"field": 1}'

	
	mongoexport --db report --collection dailyStockSummary  --query '{"month": 12 , "year" : 2018 , "day": {"$gte" : 1 , "$lte" : 31} }' --type csv --fields productId,whId,openingStock,closingStock,avgMrp,avgPurchasePrice,month,year,day --noHeaderLine --out /home/aman/Desktop/closingReport.csv


	mongoexport --db report --collection dailyStockSummary  --query '{"month": 12 , "year" : 2018 , "day": {"$gte" : 1 , "$lte" : 31} }' --type csv --fields 			productId,whId,openingStock,closingStock,avgMrp,avgPurchasePrice,month,year,day  --out /home/aman/Desktop/closingReport.csv


sudo scp -r -i ~/.ssh/scpKeys -r -P 969 stkuser@35.154.220.245:/datadisk/mongodump/filename.tgz {localcomp path}


rs.printSlaveReplicationInfo() 

rs.status() 

		
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

- SCP:
	- scp -i ~/.ssh/SK_INDO_PROD.pem -P 969 stkuser@52.220.208.92:/datadisk/mongodump/2017-12-12.tar .

- copy method:
	- db.copyDatabase ("skDev" , "sk_india","52.66.151.182")

mongodump --db skDev -u qaReadUser -p RqtVVh3DgMZAEnU2 -h 13.126.75.175

ps aux | grep gulp

mongorestore --drop -d sk_staging /home/aman/Downloads/Mongo Dumps/India/staging/22-2-2018

sudo apt-get install -y mongodb-org=3.4.5 mongodb-org-server=3.4.5 mongodb-org-shell=3.4.5 mongodb-org-mongos=3.4.5 mongodb-org-tools=3.4.5

Downgrade : sudo apt-get install -y --allow-downgrades mongodb-org=3.4.5 mongodb-org-server=3.4.5 mongodb-org-shell=3.4.5 mongodb-org-mongos=3.4.5 mongodb-org-tools=3.4.5

cursor = db.collection.find();
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}


Ip : 35.154.220.245

Admin DB:
db: admin
user: stkliveadmin
pwd: DV9TG#pyv%4t


#################################################################SERVER CREDENTIALS#####################################################################################################

	QA SERVER : ssh -i ~/.ssh/id_rsa -p 969 stkuser@13.126.75.175

	STAGING : ssh -i ~/.ssh/id_rsa -p 969 stkuser@13.126.213.242
	
	//35.154.48.174
	LIVE : ssh -i ~/.ssh/id_rsa -p 969 stkuser@newerp.storeking.in
	Live Mongo  : ssh -i ~/.ssh/id_rsa -p 969 stkuser@35.154.220.245

	ETL Server: ssh -p 969 stkuser@13.232.164.185
	ETL MONGO: ("mongodb://sakhi:mrE5ZZNAJbQfn95baj5J@13.232.164.185:27017/liveBackUp")
		("mongodb://etlUser:zy729RtRa3dmKgLNzE2L@13.232.164.185:27017/etl")
		



	sktech4542
	ssh -i ~/.ssh/id_rsa -p 35.154.220.245

	ssh -fN -i ~/.ssh/id_rsa -L 6666:localhost:969 stkuser@13.126.167.108

	ssh -fN -i ~/.ssh/id_rsa -L 6666:localhost:27017 stkuser@13.126.167.108 -p 969

	ssh -fN -i ~/.ssh/id_rsa -L 6666:localhost:27017 stkuser@35.154.220.245 -p 969 --- LIVE WORKING

######################################################################################################################################################################


13.126.167.108 27017

auth DB =  admin
user: stkadmin
pwd: m3Uy$dPXeL$4


###########################################################################################################################################################################################################
								---------------:MONGO SNIPPETS:----------------

	#.Bulk Update:
console.log("---object type--" , _order.constructor.name  , typeof _order);
		var bulk = People.collection.initializeUnorderedBulkOp();
			bulk.find({<query>}).update({<update>});
			bulk.find({<query2>}).update({<update2>});
			...
			bulk.execute(function(err) {
			    ...
			});

		var bulk = db.items.initializeUnorderedBulkOp();
			bulk.find( { status: "D" } ).update( { $set: { status: "I", points: "0" } } );
			bulk.find( { item: null } ).update( { $set: { item: "TBD" } } );
			bulk.execute();

updated = new crudder.model(updated);

###########################################################################################################################################################################################################


function _generateId(payload, order, batch, callback) {
    cuti.counter.getCount("invoiceID", null, (err, doc) => {
        if (doc) {
            var _id = `IN${batch.whId}18` + doc.next;
            callback(null, payload, _id, order, batch);
        }
        else {
            callback(new Error("Error ! Could not generate invoice id"));
        }
    });
}


####################################################################################-- SSH KEYS ----################################################################################################

Tutorial : https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1604

GENERATE SSH KEY PAIR (private and public keys for the system):
	Command :  ssh-keygen

Commands:
	Path:   ~/.ssh
	Read/copy:   cat ~/.ssh
	Edit:   sudo vi ~/.ssh 

Adding to server: Always add your public key , not private key . For comments use #
	File :  authorized_keys
	Add SSH Key:   echo "YOUR COMPLete SSH PUBLILC KEY" >> ~/.ssh/authorized_keys    (Run this command to add keys to server )


###########################################################################################################################################################################################################





###########################################################################################################################################################################################################





###########################################################################################################################################################################################################


