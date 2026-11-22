# Rebuilds the band area of the user's banner so everything fits the YouTube mobile safe area.
from PIL import Image, ImageDraw
B=Image.open('banner_livro/fundo_sem_boneco.png').convert('RGB')
W,H=2560,1440; SS=2
lay=Image.new('RGBA',(W*SS,H*SS),(0,0,0,0)); d=ImageDraw.Draw(lay)
S=lambda v:int(v*SS)
sky=(166,216,247); peach=(253,212,188); peachO=(244,186,158); cream=(252,241,228); green=(142,187,117); greenO=(96,142,78)
d.rectangle((0,S(415),S(W),S(1010)),fill=sky+(255,))
for cx in (120,2440):
    d.ellipse((S(cx-560),S(640),S(cx+560),S(1400)),fill=peach+(255,),outline=peachO+(255,),width=S(6))
def band(grow,col):
    d.rectangle((S(520-grow),S(520-grow),S(2060+grow),S(1010)),fill=col)
    for x in range(520,2061,110):
        r=72+grow; d.ellipse((S(x-r),S(520-r),S(x+r),S(520+r)),fill=col)
    for y in range(520,1011,110):
        for x in (520,2060):
            r=64+grow; d.ellipse((S(x-r),S(y-r),S(x+r),S(y+r)),fill=col)
band(14,(249,206,182,255)); band(0,cream+(255,))
for cx in (150,2410):
    blobs=((0,0,120),(-110,40,95),(110,50,100),(40,-80,85))
    for dx,dy,r in blobs: d.ellipse((S(cx+dx-r-6),S(930+dy-r-6),S(cx+dx+r+6),S(930+dy+r+6)),fill=greenO+(255,))
    for dx,dy,r in blobs: d.ellipse((S(cx+dx-r),S(930+dy-r),S(cx+dx+r),S(930+dy+r)),fill=green+(255,))
    for dx,dy in ((-60,-20),(50,10),(-10,60)): d.ellipse((S(cx+dx-18),S(930+dy-30),S(cx+dx+18),S(930+dy+30)),fill=greenO+(255,))
d.rectangle((0,S(1010),S(W),S(H)),fill=(0,0,0,0))
lay=lay.resize((W,H),Image.LANCZOS)
base=B.copy(); base.paste(lay,(0,0),lay)
def put(name,scale,x,y):
    p=Image.open(f'banner_livro/piece_{name}.png'); p=p.resize((int(p.width*scale),int(p.height*scale)),Image.LANCZOS); base.paste(p,(x,y),p)
put('title',0.75,1385,575); put('book',0.62,1028,600); put('btn',0.6,965,800)
base.save('banner_livro/base_mobile.png')
