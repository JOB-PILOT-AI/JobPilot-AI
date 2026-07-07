import axios from 'axios';

(async () => {
  try {
    const url = 'https://www.indeed.com/jobs?q=software+engineer';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.google.com/',
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    const html = response.data;
    console.log('STATUS', response.status);
    console.log('HAS_SERP', html.includes('jobsearch-SerpJobCard'), 'HAS_BEACON', html.includes('job_seen_beacon'));
    console.log(html.slice(0,4000));
  } catch (error) {
    console.error('ERR', error.message);
    if (error.response) {
      console.error('STATUS', error.response.status);
      console.error('HEADERS', error.response.headers);
    }
    process.exit(1);
  }
})();
