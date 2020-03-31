# crowdstar-backend

## How to deploy?
login with ssh to EC2 with the following command:  
```ssh 34.249.80.201```  
Include the right permission keys file.

## How to launch using PM2?
```
pm2 start index.js --name crowdstar --watch
pm2 save
pm2 startup
```

## How to update using PM2?
Just use ```git pull```.
