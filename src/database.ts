输出 async function saveEmail(env: 所有, 电子邮箱: string) {
  await env.DB.prepare(
    'INSERT INTO emails (email) VALUES (?)'
  ).bind(电子邮箱).run();
}

输出 async function getAllEmails(env: 所有) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM emails'
  ).所有();
  return results;
}
