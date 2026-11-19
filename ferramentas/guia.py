#!/usr/bin/env python3
"""Gera um guia da Infinity Guard em guias/<slug>/index.html, atualiza guias/index.html e sitemap.xml.

Uso: python3 ferramentas/guia.py guia.json
JSON: {"slug","titulo","descricao","data":"AAAA-MM-DD","resumo","secoes":[{"titulo","paragrafos":[...]}],
       "faq":[{"pergunta","resposta"}], "produto":{"nome","link","foto"} (opcional), "cta_texto" (opcional)}
Só texto puro nos campos: o script escapa o HTML.
"""
import html, json, os, re, sys, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://oferta.infinityguard.com.br"
LOJA = "https://infinityguard.com.br"
E = lambda s: html.escape(str(s or ""), quote=True)

CSS = """:root{--fundo:#050F1E;--sup:#0B1C33;--linha:#16294A;--ouro:#C49A52;--ouro2:#D9B877;--tinta:#FFFFFF;--texto:#F1F4F8;--suave:#B8C3D3}
*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--texto);font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--ouro2)}header.top{border-bottom:1px solid var(--linha);padding:14px 16px}header.top a{color:var(--tinta);text-decoration:none;font-family:Newsreader,Georgia,serif;font-size:1.15rem;letter-spacing:.02em}
header.top span{color:var(--ouro);font-size:.8rem;display:block}main{max-width:720px;margin:0 auto;padding:28px 16px 64px}
.eb{color:var(--ouro);text-transform:uppercase;letter-spacing:.14em;font-size:.75rem;margin:0 0 8px}
h1{font-family:Newsreader,Georgia,serif;font-weight:300;font-size:clamp(1.9rem,6vw,2.7rem);line-height:1.15;margin:0 0 14px;color:var(--tinta)}
h2{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:1.5rem;margin:36px 0 10px;color:var(--tinta)}
.resumo{font-size:1.1rem;color:var(--suave);border-left:2px solid var(--ouro);padding-left:14px}
.data{color:var(--suave);font-size:.85rem}.cta{background:var(--sup);border:1px solid var(--linha);border-radius:4px;padding:18px;margin:36px 0;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.cta img{width:96px;height:96px;object-fit:cover;border-radius:3px;background:#fff}.cta b{color:var(--tinta)}
.btn{display:inline-block;background:var(--ouro);color:#050F1E;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:2px;margin-top:8px}
details{border-bottom:1px solid var(--linha);padding:12px 0}summary{cursor:pointer;font-weight:600;color:var(--tinta)}
footer{border-top:1px solid var(--linha);color:var(--suave);font-size:.85rem;padding:20px 16px;text-align:center}
ul.lista{list-style:none;padding:0}ul.lista li{border-bottom:1px solid var(--linha);padding:16px 0}ul.lista a{font-family:Newsreader,Georgia,serif;font-size:1.3rem;color:var(--tinta);text-decoration:none}"""

def pagina(titulo, descricao, url, corpo, ld):
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(titulo)} | Infinity Guard</title><meta name="description" content="{E(descricao)}">
<link rel="canonical" href="{url}"><meta property="og:type" content="article"><meta property="og:title" content="{E(titulo)}">
<meta property="og:description" content="{E(descricao)}"><meta property="og:url" content="{url}"><meta property="og:site_name" content="Infinity Guard">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&display=swap" rel="stylesheet">
<style>{CSS}</style>
{''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)}
</head><body><header class="top"><a href="{SITE}/guias/">Infinity Guard<span>Segurança para quem você ama</span></a></header>
<main>{corpo}</main><footer>Infinity Guard · Loja online · <a href="{LOJA}">infinityguard.com.br</a> · <a href="{SITE}/guias/">Todos os guias</a></footer></body></html>
"""

def gerar(g):
    slug = re.sub(r"[^a-z0-9-]", "", g["slug"].lower())
    assert slug and len(g["titulo"]) <= 70 and len(g["descricao"]) <= 160, "slug vazio, título > 70 ou descrição > 160"
    data = g.get("data") or datetime.date.today().isoformat()
    url = f"{SITE}/guias/{slug}/"
    corpo = [f'<p class="eb">Guia Infinity Guard</p><h1>{E(g["titulo"])}</h1><p class="data">Publicado em {data[8:10]}/{data[5:7]}/{data[:4]}</p>']
    if g.get("resumo"): corpo.append(f'<p class="resumo">{E(g["resumo"])}</p>')
    for s in g.get("secoes", []):
        corpo.append(f'<h2>{E(s["titulo"])}</h2>' + "".join(f"<p>{E(p)}</p>" for p in s.get("paragrafos", [])))
    p = g.get("produto")
    if p and p.get("link"):
        foto = f'<img src="{E(p["foto"])}" alt="{E(p["nome"])}" loading="lazy">' if p.get("foto") else ""
        corpo.append(f'<div class="cta">{foto}<div><b>{E(p["nome"])}</b><br><span>Fotos, preço, Pix e parcelas na loja.</span><br>'
                     f'<a class="btn" href="{E(p["link"])}">{E(g.get("cta_texto") or "Ver na loja")}</a></div></div>')
    else:
        corpo.append(f'<div class="cta"><div><b>Câmeras e iluminação com sensor</b><br><a class="btn" href="{LOJA}">Conheça a loja</a></div></div>')
    faq = g.get("faq") or []
    if faq:
        corpo.append("<h2>Perguntas frequentes</h2>" + "".join(f"<details><summary>{E(f['pergunta'])}</summary><p>{E(f['resposta'])}</p></details>" for f in faq))
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": g["titulo"], "description": g["descricao"],
           "datePublished": data, "dateModified": data, "mainEntityOfPage": url,
           "author": {"@type": "Organization", "name": "Infinity Guard", "url": LOJA},
           "publisher": {"@type": "Organization", "name": "Infinity Guard", "url": LOJA}}]
    if faq:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["pergunta"], "acceptedAnswer": {"@type": "Answer", "text": f["resposta"]}} for f in faq]})
    os.makedirs(os.path.join(RAIZ, "guias", slug), exist_ok=True)
    with open(os.path.join(RAIZ, "guias", slug, "index.html"), "w", encoding="utf-8") as f:
        f.write(pagina(g["titulo"], g["descricao"], url, "".join(corpo), ld))
    # registro dos guias
    reg_path = os.path.join(RAIZ, "guias", "guias.json")
    reg = json.load(open(reg_path, encoding="utf-8")) if os.path.exists(reg_path) else []
    reg = [r for r in reg if r["slug"] != slug] + [{"slug": slug, "titulo": g["titulo"], "descricao": g["descricao"], "data": data}]
    reg.sort(key=lambda r: r["data"], reverse=True)
    json.dump(reg, open(reg_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    indice()
    sitemap(reg)
    return url

def indice():
    reg_path = os.path.join(RAIZ, "guias", "guias.json")
    reg = json.load(open(reg_path, encoding="utf-8")) if os.path.exists(reg_path) else []
    itens = "".join(f'<li><a href="{SITE}/guias/{r["slug"]}/">{E(r["titulo"])}</a><br><span class="data">{E(r["descricao"])}</span></li>' for r in reg)
    corpo = ('<p class="eb">Guias Infinity Guard</p><h1>Guias de câmeras e iluminação com sensor</h1>'
             '<p class="resumo">Respostas diretas sobre câmeras de segurança e iluminação com sensor para casa e comércio.</p>'
             + (f'<ul class="lista">{itens}</ul>' if itens else '<p>Os primeiros guias chegam em breve.</p>'))
    ld = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Guias Infinity Guard", "url": f"{SITE}/guias/"}]
    with open(os.path.join(RAIZ, "guias", "index.html"), "w", encoding="utf-8") as f:
        f.write(pagina("Guias de câmeras e iluminação com sensor", "Respostas diretas sobre câmeras de segurança e iluminação com sensor para casa e comércio.", f"{SITE}/guias/", corpo, ld))

def sitemap(reg):
    path = os.path.join(RAIZ, "sitemap.xml")
    s = open(path, encoding="utf-8").read()
    s = re.sub(r"\s*<url><loc>https://oferta\.infinityguard\.com\.br/guias/[^<]*</loc>[^\n]*</url>", "", s)
    hoje = reg[0]["data"] if reg else datetime.date.today().isoformat()
    novas = f'\n  <url><loc>{SITE}/guias/</loc><lastmod>{hoje}</lastmod></url>' + "".join(
        f'\n  <url><loc>{SITE}/guias/{r["slug"]}/</loc><lastmod>{r["data"]}</lastmod></url>' for r in reg)
    s = s.replace("</urlset>", novas + "\n</urlset>")
    open(path, "w", encoding="utf-8").write(s)

if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--indice":
        indice(); reg_path = os.path.join(RAIZ, "guias", "guias.json")
        sitemap(json.load(open(reg_path, encoding="utf-8")) if os.path.exists(reg_path) else []); print("OK indice"); sys.exit()
    print(gerar(json.load(open(sys.argv[1], encoding="utf-8"))))
