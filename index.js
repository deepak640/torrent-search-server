import express from "express";
import cors from "cors";
import TorrentSearchApi from "torrent-search-api";
import WebTorrent from "webtorrent";
import fs from "fs";
import cliProgress from "cli-progress";
import path from "path";
import crypto from "crypto";
import bencode from "bencode";
import bodyParser from "body-parser";
const app = express();
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const PORT = process.env.PORT || 3000;
app.use(cors());
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
TorrentSearchApi.enablePublicProviders();

const client = new WebTorrent();

// get torrent magnet link
const gettorrent = async (query) => {
  const torrents = await TorrentSearchApi.search(query);
  const magnetURI = torrents.filter((torrent) => torrent.magnet);
  const magnet = await TorrentSearchApi.getMagnet(magnetURI[0]);
  console.log("🚀 ~ gettorrent ~ magnet:", magnet);

  const torrentHtmlDetail = await TorrentSearchApi.getTorrentDetails(
    magnetURI[0]
  );
  console.log("🚀 ~ gettorrent ~ torrentHtmlDetail:", torrentHtmlDetail);
  return magnet;
};

function magnetToTorrent(magnetURI, outputFilePath) {
  const client = new WebTorrent();

  client.add(magnetURI, { announce: [] }, (torrent) => {
    const torrentFileBuffer = torrent.torrentFile;

    fs.writeFileSync(outputFilePath, torrentFileBuffer);
    console.log(`Torrent file created at ${outputFilePath}`);

    client.destroy(); // Destroy the client after the process is done
  });

  client.on("error", (err) => {
    console.error(`Error: ${err.message}`);
  });
}

const Download = (torrent) => {
  client.add(torrent, (torrent) => {
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
// const uri = await gettorrent("spiderman");
// Download(uri)
// magnetToTorrent(uri, "output.torrent");

function createTorrent(filePath) {
  const pieceLength = 16384; // Piece length of 16 KB
  const fileBuffer = fs.readFileSync(filePath);
  const totalLength = fileBuffer.length;
  const name = path.basename(filePath);

  // Calculate the SHA-1 hash for each piece
  const pieces = [];
  for (let i = 0; i < totalLength; i += pieceLength) {
    const end = Math.min(i + pieceLength, totalLength);
    const piece = fileBuffer.slice(i, end);
    const pieceHash = crypto.createHash("sha1").update(piece).digest();
    pieces.push(pieceHash);
  }

  const torrent = {
    info: {
      name: name,
      "piece length": pieceLength,
      pieces: Buffer.concat(pieces),
      length: totalLength,
    },
  };

  return torrent;
}

function torrentToMagnet(torrent) {
  const infoHash = crypto
    .createHash("sha1")
    .update(bencode.encode(torrent.info))
    .digest("hex");
  const magnetURI = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(
    torrent.info.name
  )}`;
  return magnetURI;
}

app.get("/", async (req, res) => {
  const torrents = await TorrentSearchApi.search("spiderman");
  console.log("working");
  const magnetURI = torrents.filter((torrent) => torrent.magnet);
  res.json(magnetURI);
});

app.post("/convert-magnet", async (req, res) => {
  const magnetURI = req.body.magnet;
  const outputFilePath = "output.torrent"
  if (!magnetURI) {
    return res.status(400).send("Magnet URI is required");
  }
  const client = new WebTorrent();

  client.add(magnetURI, { announce: [] }, (torrent) => {
    const torrentFileBuffer = torrent.torrentFile;

    fs.writeFileSync(outputFilePath, torrentFileBuffer);
    console.log(`Torrent file created at ${outputFilePath}`);
    res.send("done");
    client.destroy(); // Destroy the client after the process is done
  });

  client.on("error", (err) => {
    console.error(`Error: ${err.message}`);
  });
});

app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "output.torrent"); // Path to your text file

  res.download(filePath, "output.torrent", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error sending file");
    }else{
      // fs.rm(filePath, (err) => {
      //   if (err) {
      //     console.log(err);
      //   } else {
      //     console.log("removed");
      //   }
      // });
    }
  });

});

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("listening");
  }
});
