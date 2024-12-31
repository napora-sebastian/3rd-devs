import axios from 'axios';

export async function sendMessageToXYZ(body: { text: string; msgID: number }) {
    const response = await axios.post('https://xyz.ag3nts.org/verify', body);

    return response.data as { text: string; msgID: number };
}