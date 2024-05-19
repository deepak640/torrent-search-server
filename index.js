import express from "express";
import cors from "cors";
import TorrentSearchApi from "torrent-search-api";
import WebTorrent from "webtorrent";
import fs from "fs";
import cliProgress from "cli-progress";
import { magnetDecode } from "@ctrl/magnet-link";
import ParseTorrent from "parse-torrent";

const app = express();
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const PORT = process.env.PORT || 3000;
app.use(cors());
TorrentSearchApi.enablePublicProviders();

const client = new WebTorrent();

const torrents = await TorrentSearchApi.search("spiderman");
const magnetURI = torrents.filter((torrent) => torrent.magnet);
const magnet = await TorrentSearchApi.getMagnet(magnetURI[0]);

const torrentHtmlDetail = await TorrentSearchApi.getTorrentDetails(
  magnetURI[0]
);


// Function to convert magnet link to torrent file
function magnetToTorrent(magnetURI, outputFilePath) {
  const client = new WebTorrent();

  client.add(magnetURI, { announce: [] }, (torrent) => {
    const torrentFileBuffer = torrent.torrentFile;

    fs.writeFileSync(outputFilePath, torrentFileBuffer);
    console.log(`Torrent file created at ${outputFilePath}`);

    client.destroy(); // Destroy the client after the process is done
  });

  client.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}


// Example usage
const outputFilePath = "output.torrent";
magnetToTorrent(magnet, outputFilePath);

const Download = () => {
  client.add(magnetURI[0].magnet, (torrent) => {
    const files = torrent.files;
    let length = files.length;
    console.log("Number of files :- \t", +length);
    bar.start(100, 0);
    let interval = setInterval(() => {
      bar.update(torrent.progress * 100);
    }, 5000);
    files.forEach((file) => {
      const source = file.createReadStream();
      const destination = fs.createWriteStream(file.name);
      source
        .on("end", () => {
          console.log("file : \t\t", file.name);
          length -= 1;
          if (!length) {
            bar.stop();
            clearInterval(interval);
            process.exit();
          }
        })
        .pipe(destination);
    });
  });
};

// const parsed = magnetDecode(magnetURI[0].magnet);
// console.log(parsed.dn); // "Leaves of Grass by Walt Whitman.epub"
// console.log(parsed.infoHash); // "d2474e86c95b19b8bcfdb92bc12c9d44667cfa36"


