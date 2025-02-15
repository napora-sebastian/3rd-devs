import OpenAI from "openai";

const openai = new OpenAI();

const description = 'Przejeżdżał koło mnie taki jeden... mówię przejeżdżał, bo on nie miał nóg, tylko gąsienice. Takie wiesz... jak czołg. Niski był. To chyba robot patrolujący. Jeździł w kółko i tylko skanował w koło tymi swoimi kamerami. To było stresujące, ale na szczęście mnie nie zauważył. Dobrze się ukryłem.'

const prompt = `Generate a picture from the description ${description}. Expected format PNG. Expected image size 1024x1024px`;

const response = await openai.images.generate({
  model: "dall-e-3",
  prompt,
  n: 1,
  size: "1024x1024",
});

console.log(response.data[0].url);