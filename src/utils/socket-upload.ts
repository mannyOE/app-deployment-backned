import { statSync, open, write, createReadStream, createWriteStream, unlink, existsSync, mkdirSync } from 'fs';
import { 
    Creds as credentials,
    Merges as merges 
} from '../models';
import Credentials from '../modules/credentials';
const credential = new Credentials({
	model: credentials,
	merges
});

if (!existsSync('tmp'))
	mkdirSync('tmp');

let files: any = {};
const fileSizeRange: number = 5000000;
const minFileBuffer: number = 10485760; // 10MB

let SocketUpload = function uploadProcess(socket: any){
    // Track upload progress
    socket.on('Start', (data: any) => {
        const appId = data['appId'];
        const tempPath = `tmp/${appId}`;

        files[appId] = {
            fileSize: data['size'],
            data: '',
            downloaded: 0
        };

        let startingRange = 0;
        try {
            let stats = statSync(tempPath);
            if(stats.isFile())
            {
                files[appId]['downloaded'] = stats.size;
                startingRange = stats.size / fileSizeRange;
            }
        }
        catch(error){}
        
        open(tempPath, 'a', 0o755,(err, fd) => {
            if(err)
                console.log(err);
            else
            {
                files[appId]['handler'] = fd;
                socket.emit('UploadData', { startingRange, percent : 0 });
            }
        });
    });

    // Upload file
    socket.on('Upload', (data: any) => {
        const appId = data['appId'];
        const projectRoot = process.env.CLOUDINARY_NAME || 'zeedas';
        const filePath =  projectRoot.concat('/', appId, '.zip');
        const tempPath = `tmp/${appId}`;

        files[appId]['downloaded'] += data['data'].length;
        files[appId]['data'] += data['data'];

        if (files[appId]['downloaded'] === files[appId]['fileSize'])
        {
            // @ts-ignore
            write(files[appId]['handler'], files[appId]['data'], null, 'Binary', () => {
                let inp = createReadStream(tempPath);
                let out = createWriteStream(filePath);
                inp.pipe(out);
                inp.on('end', () => {
                    unlink(tempPath, () => {
                        files = {};
                        socket.emit('Done', {});

                        // Decompress and save file
                        credential.updateFiles(data.appId, data.data, filePath);
                    });
                });
            });
        }
        else if (files[appId]['data'].length > minFileBuffer)
        {
            // @ts-ignore
            write(files[appId]['handler'], files[appId]['data'], null, 'Binary', () => {
                files[appId]['data'] = '';
                let startingRange = files[appId]['downloaded'] / fileSizeRange;
                let percent = (files[appId]['downloaded'] / files[appId]['fileSize']) * 100;
                socket.emit('UploadData', { startingRange,  percent });
            });
        }
        else
        {
            let startingRange = files[appId]['downloaded'] / fileSizeRange;
            let percent = (files[appId]['downloaded'] / files[appId]['fileSize']) * 100;
            socket.emit('UploadData', { startingRange,  percent });
        }
    });

    // Download file
    socket.on('Download', async (data: any) => {
        const files = await credential.getFiles(data.appId);
        socket.emit('DownloadData', { files });
    });
}

export default SocketUpload;