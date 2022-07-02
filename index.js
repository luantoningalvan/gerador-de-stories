const readline = require("readline");
const fs = require("fs");
const client = require("https");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const FONT_FAMILY = "Poppins";
const FONT_COLOR = "#fff";

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printInColor(text, color) {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
  };

  console.log(`${colors[color]}%s\x1b[0m`, text);
}

function generateName() {
  const randomString = (Math.random() + 1).toString(36).substring(7);
  return `${randomString}.jpg`;
}

function downloadImage(url) {
  const imagePath = `downloads/${generateName()}`;

  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        printInColor("Baixando imagem do fundo", "blue");
        res
          .pipe(fs.createWriteStream(imagePath))
          .on("error", reject)
          .once("close", () => resolve(imagePath));
      } else {
        res.resume();
        reject(new Error("Falha ao baixar imagem"));
      }
    });
  });
}

async function generateImageWithImageBackground(bg, phrase, username) {
  const resultFileName = `result-${generateName()}`;

  const { stderr } = await exec(
    `convert ${bg} -gravity Center -resize '1080x1920^' -crop 1080x1920+0+0 +repage -blur 0x5\
      assets/vignette.png -geometry +0+0 -composite\
      -background none -fill "${FONT_COLOR}" -family "${FONT_FAMILY}" -weight Medium -gravity SouthWest\
      -pointsize 64x -size 850x caption:'${phrase}' -geometry +65+390 -composite \
      -pointsize 36x -size 850x caption:'${username}' -geometry +65+275 -composite \
      +append generated/${resultFileName}
    `
  );

  if (stderr) {
    throw new Error(`stderr: ${stderr}`);
  }

  return resultFileName;
}

async function generateImageWithSolidBackground(bg, phrase, username) {
  const resultFileName = `result-${generateName()}`;

  const { stderr } = await exec(
    `convert -size 1080x1920 canvas:${bg} -gravity Center \
      -background none -fill "${FONT_COLOR}" -family "${FONT_FAMILY}" -weight Medium -gravity SouthWest\
      -pointsize 64x -size 850x caption:'${phrase}' -geometry +65+390 -composite \
      -pointsize 36x -size 850x caption:'${username}' -geometry +65+275 -composite \
      +append generated/${resultFileName}
    `
  );

  if (stderr) {
    throw new Error(`stderr: ${stderr}`);
  }

  return resultFileName;
}

async function main() {
  try {
    const phrase = await prompt("Digite a frase: ");
    const username = await prompt("Digite o username: ");
    const type = await prompt(
      "Selecione o tipo de fundo 1(sólido) 2(imagem): "
    );

    let imageName;

    if (type === "1") {
      const backgroundColor = await prompt("Cor do fundo: ");
      imageName = await generateImageWithSolidBackground(
        backgroundColor,
        phrase,
        username
      );
    }

    if (type === "2") {
      const imageUrl = await prompt("URL da imagem de fundo: ");
      const backgroundImage = await downloadImage(imageUrl);
      imageName = await generateImageWithImageBackground(
        backgroundImage,
        phrase,
        username
      );
    }

    printInColor(
      `✅ Imagem gerada com sucesso com o nome de ${imageName}`,
      "green"
    );
  } catch (error) {
    printInColor(error.message, "red");
  }
}

main();
