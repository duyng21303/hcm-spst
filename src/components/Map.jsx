import {useEffect, useMemo, useRef, useState} from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import {timeline as TL} from '../data/timeline';
import {motion, AnimatePresence} from 'framer-motion';

const HISTO_URL = "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1900.geojson";
const SAMPLES = 64;
const SPEED_PX_PER_MS_SLOW = 0.2;

export default function Map(){
  const svgRef = useRef(null);
  const infoRef = useRef(null);
  const tipRef  = useRef(null);

  const [mode, setMode] = useState('slow'); // 'slow' | 'full'
  const [card, setCard] = useState(null);   // { d, htmlString }

  // ===== helpers dữ liệu
  const aggregateStops = (steps)=>{
    const m = new globalThis.Map(); // <-- FIX: dùng global Map
    for(const s of steps){
      if(!m.has(s.key)) m.set(s.key, {...s, years:[...(s.years||[s.year]).filter(Boolean)]});
      else m.get(s.key).years = Array.from(new Set([
        ...m.get(s.key).years, ...(s.years||[s.year]).filter(Boolean)
      ])).sort((a,b)=>a-b);
    }
    return [...m.values()];
  };
  const aggStops = useMemo(()=>aggregateStops(TL), []);

  const arcPoints = (a,b,n=SAMPLES)=>{
    const inter = d3.geoInterpolate([a.lon,a.lat],[b.lon,b.lat]);
    const pts=[]; for(let i=0;i<=n;i++){ const [L,Lt]=inter(i/n); pts.push({lon:L,lat:Lt}); }
    return pts;
  };
  const smoothLine = d3.line()
    .x(d=>projection([d.lon,d.lat])[0])
    .y(d=>projection([d.lon,d.lat])[1])
    .curve(d3.curveCatmullRom.alpha(0.9));

  // ===== projection, layers
  const size = {w:1400, h:720};
  const projection = useMemo(()=>d3.geoNaturalEarth1().translate([size.w/2,size.h/2]).scale(250), []);
  const geoPath = useMemo(()=>d3.geoPath(projection), [projection]);

  const layersRef = useRef(null);

  // ===== cache HTML ngoài
  const _htmlCache = useRef(new globalThis.Map()); // <-- FIX

  async function loadExternalHTML(url){
    if(_htmlCache.current.has(url)) return _htmlCache.current.get(url);
    try{
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status);
      const txt=await r.text(); _htmlCache.current.set(url, txt); return txt;
    }catch(e){
      return `<object type="text/html" data="${url}" style="border:0;width:100%;min-height:260px;"></object>`;
    }
  }

  async function showCard(d){
    const years = (d.years||[]).join(', ');
    let bodyHTML = d.html || '';
    if(d.contentUrl) bodyHTML = await loadExternalHTML(d.contentUrl);
    setCard({
      title: d.name,
      img: d.img || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/512px-No_image_available.svg.png',
      years,
      html: bodyHTML
    });
    setTimeout(()=>{ infoRef.current?.scrollIntoView({behavior:'smooth', block:'start'}); }, 0);
  }

  const showTip = (text, event)=>{
    const svgEl = svgRef.current;
    const pt = d3.pointer(event, svgEl);
    const el = tipRef.current;
    el.textContent = text;
    el.style.left = pt[0] + "px";
    el.style.top  = pt[1] + "px";
    el.style.opacity = 1;
  };
  const hideTip = ()=>{ if(tipRef.current) tipRef.current.style.opacity = 0; };

  useEffect(()=>{
    const svg = d3.select(svgRef.current).attr('viewBox', [0,0,size.w,size.h]);

    const defs = svg.append("defs");
    const paper=defs.append("filter").attr("id","paperGrain");
    paper.append("feTurbulence").attr("type","fractalNoise").attr("baseFrequency","0.8").attr("numOctaves","2").attr("seed","2").attr("result","noise");
    paper.append("feColorMatrix").attr("type","saturate").attr("values","0.15");
    paper.append("feBlend").attr("mode","multiply").attr("in","SourceGraphic").attr("in2","noise");
    const glow=defs.append("filter").attr("id","routeGlow").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    glow.append("feGaussianBlur").attr("stdDeviation","1.1").attr("result","blur");
    const mg=glow.append("feMerge"); mg.append("feMergeNode").attr("in","blur"); mg.append("feMergeNode").attr("in","SourceGraphic");

    const gridLayer = svg.append("g");
    const landLayer = svg.append("g");
    const bordersLayer = svg.append("g");
    const routeLayer = svg.append("g");
    const stopLayer = svg.append("g");
    const labelLayer = svg.append("g");

    gridLayer.append("path").attr("class","graticule").attr("d", geoPath(d3.geoGraticule10()));
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json").then(world=>{
      landLayer.append("path")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class","land").attr("d", geoPath);
    });
    d3.json(HISTO_URL).then(fc=>{
      bordersLayer.selectAll("path").data(fc.features).enter()
        .append("path").attr("d", geoPath).attr("class","borders");
      const placed=[], area=f=>Math.abs(geoPath.area(f));
      const nameOf=p=>p.NAME||p.SOVEREIGN||p.TITLE||p.name||"—";
      [...fc.features].sort((a,b)=>area(b)-area(a)).forEach(f=>{
        const A=area(f); if(A<20) return; const c = d3.geoCentroid(f);
        const xy = projection(c); if(!isFinite(xy[0])) return;
        const box={x:xy[0]-45,y:xy[1]-9,w:90,h:14};
        if(placed.some(a=>!(box.x+box.w<a.x||a.x+a.w<box.x||box.y+box.h<a.y||a.y+a.h<box.y))) return;
        placed.push(box);
        labelLayer.append("text").attr("class","label").attr("text-anchor","middle")
          .attr("transform",`translate(${xy[0]},${xy[1]})`)
          .text(nameOf(f.properties).toUpperCase());
      });

      layersRef.current = {svg, defs, gridLayer, landLayer, bordersLayer, routeLayer, stopLayer, labelLayer};
      renderRoutes('slow');
    });

    return ()=>{ svg.selectAll('*').remove(); };
    // eslint-disable-next-line
  },[]);

  useEffect(()=>{
    if(layersRef.current) renderRoutes(mode);
    // eslint-disable-next-line
  }, [mode]);

  function renderRoutes(currentMode){
    const {defs, routeLayer, stopLayer} = layersRef.current;
    routeLayer.selectAll('*').remove();
    stopLayer.selectAll('*').remove();
    defs.selectAll('mask').remove();

    const segments = ()=>{ const segs=[]; for(let i=0;i<TL.length-1;i++) segs.push([TL[i],TL[i+1]]); return segs; };

    if(currentMode==='full'){
      segments().forEach(([A,B])=>{
        routeLayer.append("path").attr("class","route")
          .attr("d", d3.line()
            .x(d=>projection([d.lon,d.lat])[0])
            .y(d=>projection([d.lon,d.lat])[1])
            .curve(d3.curveCatmullRom.alpha(0.9))(arcPoints(A,B,SAMPLES)))
          .attr("filter","url(#routeGlow)");
      });

      const nodes=stopLayer.selectAll("g.stop").data(aggStops,d=>d.key).enter().append("g").attr("class","stop")
        .attr("transform",d=>`translate(${projection([d.lon,d.lat])})`)
        .on("click",(e,d)=>showCard(d))
        .on("mouseenter",(e,d)=>showTip(d.name,e)).on("mouseleave",hideTip);

      nodes.append("circle").attr("class","outer").attr("r",0)
        .transition().delay((d,i)=>i*40).duration(400).attr("r",14);
      nodes.append("circle").attr("class","ring").attr("r",0)
        .transition().delay((d,i)=>i*40).duration(400).attr("r",9);
      nodes.append("circle").attr("class","dot").attr("r",0)
        .transition().delay((d,i)=>i*40).duration(400).attr("r",4.2);
      return;
    }

    let tracker=routeLayer.append("circle").attr("class","tracker").attr("r",5).attr("filter","url(#routeGlow)");
    const p0=projection([TL[0].lon,TL[0].lat]); tracker.attr("cx",p0[0]).attr("cy",p0[1]);

    let i=0;
    const smoothLine = d3.line()
      .x(d=>projection([d.lon,d.lat])[0])
      .y(d=>projection([d.lon,d.lat])[1])
      .curve(d3.curveCatmullRom.alpha(0.9));

    function arcPoints(a,b,n=SAMPLES){
      const inter = d3.geoInterpolate([a.lon,a.lat],[b.lon,b.lat]);
      const pts=[]; for(let i=0;i<=n;i++){ const [L,Lt]=inter(i/n); pts.push({lon:L,lat:Lt}); }
      return pts;
    }

    function drawSeg(){
      if (i >= TL.length - 1) {
    routeLayer.selectAll('*').remove();
    stopLayer.selectAll('*').remove();
    defs.selectAll('mask').remove();

    // tạo lại tracker ở điểm xuất phát
    tracker = routeLayer.append("circle")
      .attr("class","tracker").attr("r",5)
      .attr("filter","url(#routeGlow)");
    const p0 = projection([TL[0].lon, TL[0].lat]);
    tracker.attr("cx", p0[0]).attr("cy", p0[1]);

    i = 0;
    setTimeout(drawSeg, 400); // nghỉ nhẹ cho dễ nhìn
    return;
  }
      const A=TL[i], B=TL[i+1];
      const pathStr = smoothLine(arcPoints(A,B,SAMPLES));

      const mid=`reveal-${i}-${Date.now()}`;
      const m=defs.append("mask").attr("id",mid);
      m.append("rect").attr("width",1400).attr("height",720).attr("fill","black");
      const reveal=m.append("path").attr("d",pathStr).attr("fill","none").attr("stroke","white").attr("stroke-width",6).attr("stroke-linecap","round");

      const vis=routeLayer.append("path").attr("class","route").attr("d",pathStr).attr("mask",`url(#${mid})`).attr("filter","url(#routeGlow)");

      const L=vis.node().getTotalLength();
      reveal.attr("stroke-dasharray",`0 ${L}`);

      const dur=Math.max(700, L / SPEED_PX_PER_MS_SLOW);
      d3.transition().duration(dur).ease(d3.easeLinear)
        .tween("grow",()=>t=>{
          const drawn=L*t;
          reveal.attr("stroke-dasharray",`${drawn} ${L}`);
          const pt=vis.node().getPointAtLength(drawn);
          tracker.attr("cx",pt.x).attr("cy",pt.y);
        })
        .on("end",()=>{
          const g=stopLayer.append("g").datum(B).attr("class","stop")
            .attr("transform",`translate(${projection([B.lon,B.lat])})`)
            .on("click",()=>showCard(aggStops.find(s=>s.key===B.key)))
            .on("mouseenter",(e)=>showTip(B.name,e)).on("mouseleave",hideTip);
          g.append("circle").attr("class","outer").attr("r",0).transition().duration(450).attr("r",14);
          g.append("circle").attr("class","ring").attr("r",0).transition().duration(450).attr("r",9);
          g.append("circle").attr("class","dot").attr("r",0).transition().duration(450).attr("r",4.2);

          i++; drawSeg();
        });
    }
    drawSeg();
  }

  useEffect(()=>{
    const bar = document.getElementById('progress-bar');
    const onScroll = ()=>{
      const h = document.documentElement;
      const scrolled = (h.scrollTop)/(h.scrollHeight - h.clientHeight);
      bar.style.width = (scrolled*100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
    return ()=> window.removeEventListener('scroll', onScroll);
  },[]);

  return (
    <section id="map-section">
      <div id="progress-bar" className="progress" aria-hidden="true"></div>

      <div className="topbar">
        <div className="tabs" role="tablist" aria-label="Chế độ xem">
          <button className={`tab ${mode==='slow'?'active':''}`} role="tab" aria-selected={mode==='slow'} onClick={()=>setMode('slow')}>Hành trình (chậm)</button>
          <button className={`tab ${mode==='full'?'active':''}`} role="tab" aria-selected={mode==='full'} onClick={()=>setMode('full')}>Xem toàn tuyến</button>
        </div>
        <div style={{opacity:.75}}>Gợi ý: bấm các vòng tròn đỏ để xem thông tin</div>
      </div>

      <div className="frame">
        <svg ref={svgRef} aria-label="Vintage world route map"></svg>
      </div>

      <div ref={infoRef} className="panel" aria-live="polite">
        <AnimatePresence mode="wait">
          {card && (
            <motion.article
              key={card.title}
              className="card"
              role="region"
              aria-label={card.title}
              initial={{opacity:0, y:12}}
              animate={{opacity:1, y:0}}
              exit={{opacity:0, y:12}}
              transition={{duration:.35, ease:'easeOut'}}
            >
              <header>
                <img src={card.img} alt={card.title}
                     onError={(e)=>{e.currentTarget.src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/512px-No_image_available.svg.png'}}/>
                <div>
                  <h3>{card.title}</h3>
                  <div className="years">Các năm ghé: {card.years || '—'}</div>
                </div>
              </header>
              <div className="body" dangerouslySetInnerHTML={{__html: card.html}} />
            </motion.article>
          )}
        </AnimatePresence>
      </div>

      <div ref={tipRef} className="tooltip" aria-hidden="true"></div>
    </section>
  );
}
