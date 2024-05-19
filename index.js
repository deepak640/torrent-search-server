import express from "express";
import cors from "cors";
import TorrentSearchApi from "torrent-search-api";
import WebTorrent from "webtorrent";
import fs from "fs";
import cliProgress from "cli-progress";

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
// const buffer = await TorrentSearchApi.downloadTorrent(magnetURI[0]);
// console.log("🚀 ~ buffer:", buffer)

// Read the video file

// client.add(magnetURI[0].magnet, (torrent) => {
//   const files = torrent.files;
//   let length = files.length;
//   console.log("Number of files :- \t", +length);
//   bar.start(100, 0);
//   let interval = setInterval(() => {
//     bar.update((torrent.progress * 100))
//   }, 5000);
//   files.forEach((file) => {
//     const source = file.createReadStream();
//     const destination = fs.createWriteStream(file.name);
//     source
//       .on("end", () => {
//         console.log("file : \t\t", file.name);
//         length -= 1;
//         if (!length) {
//           bar.stop()
//           clearInterval(interval);
//           process.exit();
//         }
//       })
//       .pipe(destination);
//   });
// });

// const parsed = magnetDecode(magnets[0].magnet);
// console.log(parsed.dn); // "Leaves of Grass by Walt Whitman.epub"
// console.log(parsed.infoHash); // "d2474e86c95b19b8bcfdb92bc12c9d44667cfa36"

//   res.json(magnetURI);
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
