# Como ligar a 24AGÁ no Supabase (15 minutos)

1. Crie a conta grátis em **supabase.com** (pode entrar com o GitHub roityacademy).
2. Clique em **New project**:
   - Nome: `24aga`
   - Senha do banco: crie uma forte e guarde (não mande para ninguém).
   - Região: **South America (São Paulo)**.
3. No menu da esquerda, abra **SQL Editor → New query**, cole todo o arquivo `schema.sql` e clique em **Run**. Deve aparecer "Success".
4. Abra **Project Settings → API** e copie:
   - **Project URL** (ex.: `https://abcd.supabase.co`)
   - **anon / publishable key** (é pública, pode mandar).
   - **NÃO** copie nem envie a `service_role` key.
5. Mande a URL e a anon key para o Claude (ou cole no arquivo `config.js`). Mande também o WhatsApp comercial da ROITY Academy, se quiser que o formulário abra o WhatsApp.
6. Para ver os contatos que chegarem pelo site: **Table Editor → leads**.
7. Para virar dono da plataforma: crie seu usuário em **Authentication → Users → Add user** e rode no SQL Editor (trocando o e-mail):

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'SEU-EMAIL-AQUI';
```

O que já fica pronto no banco: clínicas, assinaturas e planos, usuários por clínica (dona, recepção, profissional), equipe, salas, serviços, horários, pacientes, agenda **com bloqueio de horário duplicado no próprio banco**, avaliações (só profissional vê), conversas e mensagens do WhatsApp, propostas, notificações, tarefas, lembretes, configurações da IA, consumo mensal, suporte e leads do site. Cada clínica só vê os próprios dados.
