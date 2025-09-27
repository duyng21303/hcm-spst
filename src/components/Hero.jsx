import {useRef, useEffect} from 'react';
import {motion} from 'framer-motion';

export default function Hero(){
  const videoRef = useRef(null);

  useEffect(()=>{
    const onHidden = () => { if (document.hidden) videoRef.current?.pause(); };
    document.addEventListener('visibilitychange', onHidden);
    return ()=> document.removeEventListener('visibilitychange', onHidden);
  },[]);

  const toggleMute = ()=>{
    const v = videoRef.current; if(!v) return;
    v.muted = !v.muted;
    // force update button label via dataset if muốn, ở đây dùng title
  };
  const togglePause = ()=>{
    const v = videoRef.current; if(!v) return;
    if(v.paused) v.play(); else v.pause();
  };
  const replay = ()=>{
    const v = videoRef.current; if(!v) return;
    v.currentTime = 0; v.play();
  };
  const scrollToMap = ()=>{
    document.getElementById('map-section')?.scrollIntoView({behavior:'smooth'});
  };

  return (
    <header className="hero" id="hero">
      <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  loop
  poster="https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg?auto=compress&cs=tinysrgb&w=1600"
>
  <source src="/video.mp4" type="video/mp4" />
</video>

      <div className="inner">
        <motion.div
          initial={{opacity:0, y:20}}
          animate={{opacity:1, y:0}}
          transition={{duration:.7, ease:'easeOut'}}
        >
          <motion.h1
            initial={{opacity:0, y:10}}
            animate={{opacity:1, y:0}}
            transition={{delay:.1, duration:.6}}
          >
            Hành trình “tìm đường cứu nước”
          </motion.h1>
          <motion.p className="lead"
            initial={{opacity:0, y:10}}
            animate={{opacity:1, y:0}}
            transition={{delay:.2, duration:.6}}
          >
            Trải nghiệm tuyến đường lịch sử của Chủ tịch Hồ Chí Minh trên bản đồ vintage tương tác —
            bấm các điểm dừng để mở tư liệu chi tiết.
          </motion.p>

          <div className="cta">
            <button className="btn primary" onClick={scrollToMap}>Bắt đầu hành trình</button>
            <button className="btn ghost mini" onClick={toggleMute}>Bật/Tắt tiếng</button>
            <button className="btn ghost mini" onClick={togglePause}>Phát/Tạm dừng</button>
          </div>
        </motion.div>
      </div>

      <div className="dock">
        <button className="btn ghost mini" onClick={replay} title="Xem lại từ đầu">↺ Xem lại</button>
      </div>

      <div className="scroll-indicator" aria-hidden="true">
        <svg width="26" height="36" viewBox="0 0 26 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="24" height="34" rx="12" stroke="white" opacity=".8"/>
          <circle cx="13" cy="9" r="3" fill="white"/>
        </svg>
      </div>
    </header>
  );
}
