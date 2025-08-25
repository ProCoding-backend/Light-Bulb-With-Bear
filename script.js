const {
    gsap: { registerPlugin, set, to, timeline },
    MorphSVGPlugin,
    Draggable
  } = window;
  registerPlugin(MorphSVGPlugin);
  
  // Used to calculate distance of "tug"
  let startX;
  let startY;
  let count = 0;
  const AUDIO = {
    CLICK: new Audio('https://assets.codepen.io/605876/click.mp3')
  };
  
  const STATE = {
    ON: false
  };
  
  const CORD_DURATION = 0.1;
  
  const CORDS = document.querySelectorAll('.toggle-scene__cord');
  const HIT = document.querySelector('.toggle-scene__hit-spot');
  const DUMMY = document.querySelector('.toggle-scene__dummy-cord');
  const DUMMY_CORD = document.querySelector('.toggle-scene__dummy-cord line');
  const PROXY = document.createElement('div');
  const door = document.querySelector('.door.lighter');
  const arm = document.querySelector('.arm');
  const face = document.querySelector('.face');
  // set init position
  const ENDX = DUMMY_CORD.getAttribute('x2');
  const ENDY = DUMMY_CORD.getAttribute('y2');
  const RESET = () => {
    set(PROXY, {
      x: ENDX,
      y: ENDY
    });
  };
  
  RESET();
  function armOut (){
    arm.classList.add("open");
    arm.classList.remove("close");
  }
  function armIn (){
    arm.classList.add("close");
    arm.classList.remove("open");
  }
  function faceOut (){
    face.classList.add("out");
    face.classList.remove("in");
  }
  function faceIn (){
    face.classList.add("in");
    face.classList.remove("out");
  }
  function armMotion (){
    setTimeout(() => {
      armOut(); // Execute firstFunction after 2 seconds
      setTimeout(() => {
        turnOff();
        armIn(); // Execute secondFunction after another 2 seconds
      }, 1200);
    }, 150);
  }
  function faceMotion (){
    setTimeout(() => {
      faceOut(); // Execute firstFunction after 2 seconds
      setTimeout(() => {
        faceIn();
      }, 1200);
    }, 150);
  }
  const CORD_TL = timeline({
    paused: true,
    onStart: () => {
      // toggle state (drag behavior uses this)
      STATE.ON = !STATE.ON;
      set(document.documentElement, { '--on': STATE.ON ? 1 : 0 });
      set([DUMMY, HIT], { display: 'none' });
      set(CORDS[0], { display: 'block' });
      AUDIO.CLICK.play();
      if (STATE.ON) {
        count++;
        door.classList.remove("close");
        door.classList.add("open");
        if(count === 3){
        setTimeout(() => {
          faceOut(); // Execute firstFunction after 2 seconds
          setTimeout(() => {
            faceIn();
            armMotion(); // Execute secondFunction after another 2 seconds
          }, 1200);
        }, 150);
        count = 0;
      }else if(count < 3){
        setTimeout(() => {
          armOut(); // Execute firstFunction after 2 seconds
          setTimeout(() => {
            turnOff();
            armIn(); // Execute secondFunction after another 2 seconds
          }, 1200);
        }, 150);
      }

      } else {
        door.classList.remove("open");
        door.classList.add("close");
        armIn();

      }
    },
    onComplete: () => {
      set([DUMMY, HIT], { display: 'block' });
      set(CORDS[0], { display: 'none' });
      RESET();
    }
  });
  
  for (let i = 1; i < CORDS.length; i++) {
    CORD_TL.add(
      to(CORDS[0], {
        morphSVG: CORDS[i],
        duration: CORD_DURATION,
        repeat: 1,
        yoyo: true
      })
    );
  }
  
  /* ---------------------------
     New: helper to set UI state
     --------------------------- */
  function applyUIState(isOn) {
    STATE.ON = !!isOn;
    set(document.documentElement, { '--on': STATE.ON ? 1 : 0 });
    if (STATE.ON) {
      door.classList.add("open");
      door.classList.remove("close");
      setTimeout(function() {
        // Code to be executed after the delay
        arm.classList.add("open");
      }, 2000); // 2000 milliseconds = 2 seconds
    } else {
      door.classList.remove("open");
      door.classList.add("close");
    }
  }
  
  /* --------------------------------------------
     New: small cord animation that does NOT
     toggle STATE again (safe to call directly)
     -------------------------------------------- */
  function animateCordOnce() {
    // build a small timeline that morphs through the same frames
    // but does NOT flip STATE (unlike CORD_TL.onStart)
    const tempTl = timeline({
      onStart: () => {
        set([DUMMY, HIT], { display: 'none' });
        set(CORDS[0], { display: 'block' });
        // play click sound for feedback
        try { AUDIO.CLICK.currentTime = 0; } catch (e) {}
        AUDIO.CLICK.play();
      },
      onComplete: () => {
        set([DUMMY, HIT], { display: 'block' });
        set(CORDS[0], { display: 'none' });
        RESET();
      }
    });
  
    for (let i = 1; i < CORDS.length; i++) {
      tempTl.add(
        to(CORDS[0], {
          morphSVG: CORDS[i],
          duration: CORD_DURATION,
          repeat: 1,
          yoyo: true
        })
      );
    }
  
    tempTl.restart();
    return tempTl;
  }
  
  /* --------------------------------------------
     New: public functions to explicitly
     turn the light on or off.
     They update STATE and UI, play sound,
     and optionally run the cord animation.
     -------------------------------------------- */
  function turnOn({ animate = true } = {}) {
    if (STATE.ON) return; // already on
    applyUIState(true);
    try { AUDIO.CLICK.currentTime = 0; } catch (e) {}
    AUDIO.CLICK.play();
    if (animate) animateCordOnce();
  }
  
  function turnOff({ animate = true } = {}) {
    if (!STATE.ON) return; // already off
    applyUIState(false);
    try { AUDIO.CLICK.currentTime = 0; } catch (e) {}
    AUDIO.CLICK.play();
    if (animate) animateCordOnce();
  }
  
  // expose to window so you can call from console or other scripts
  window.turnOn = turnOn;
  window.turnOff = turnOff;
  
  /* ---------------------------
     Original draggable logic
     --------------------------- */
  Draggable.create(PROXY, {
    trigger: HIT,
    type: 'x,y',
    onPress: e => {
      startX = e.x;
      startY = e.y;
    },
    onDrag: function () {
      set(DUMMY_CORD, {
        attr: {
          x2: this.x,
          y2: this.y
        }
      });
    },
    onRelease: function (e) {
      const DISTX = Math.abs(e.x - startX);
      const DISTY = Math.abs(e.y - startY);
      const TRAVELLED = Math.sqrt(DISTX * DISTX + DISTY * DISTY);
      to(DUMMY_CORD, {
        attr: { x2: ENDX, y2: ENDY },
        duration: CORD_DURATION,
        onComplete: () => {
          if (TRAVELLED > 50) {
            CORD_TL.restart();
          } else {
            RESET();
          }
        }
      });
    }
  });
  