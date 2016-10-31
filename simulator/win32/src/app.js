var ROTATE_DIRECTION = {
  none : 0,
  clockWise : 1,
  ctrClockWise : 2
};

var CLUTCH_GAP = 12;

var ROTATE_SPEED = 100;

var BackgroundLayer = cc.Layer.extend({
  ctor:function () {
    this._super();
    
    var size = cc.winSize;
    
    this.sprite = new cc.Sprite(res.BG_png);
    this.sprite.setPosition( size.width/2, size.height/2 );
    this.addChild(this.sprite);
    
    return true;
  }
});

var TransmissionLayer = cc.Layer.extend({
  ctor:function () {
    this._super();
    
    this._movingGears = [];
    this._allGears = [];
    this._spindles = [];
    
    this._engineGear = null;
    
    this.createScreen();
    this.createListeners();
    
    return true;
  },
  createScreen:function () {
    
    this.createSpindles();
    this.createGears();
  },
  createSpindles:function () {
    var positions = [
      {x : 10, y : 805},
      {x : 176, y : 710 },
      {x : 356, y : 704 },
      {x : 492, y : 578 },
      {x : 396, y : 500 },
      {x : 375, y : 376 },
      {x : 458, y : 264 },
      {x : 541, y : 330 },
      {x : 218, y : 534 },
      {x : 507, y : 453 },
      {x : 548, y : 754 },
      {x : 112, y : 427 },
      {x : 223, y : 278 },
      {x : 629, y : 400}
    ];
    
    for(var i = 0; i < positions.length; i++) {
      
      var newSpindle = new cc.Sprite(res.Spindle_png);
      newSpindle.setPosition(positions[i].x, positions[i].y);
      newSpindle.setLocalZOrder(-10);
      
      this.addChild(newSpindle);
      
      this._spindles.push(newSpindle);
    }
    
  },
  createGears:function () {
    var tag = 10;
    
    var gearsNames = [
      "GearBrown_png",
      "GearGreen_png",
      "GearPink_png",
      "GearViolet_png",
      "GearYellow_png",
      "GearRed_png",
      "GearGrey_png"
    ];
   
    for(var i = 0; i < gearsNames.length; i++) {
      
      var currName = gearsNames[i];
      var newGear = new GearSprite(res[currName]);
      
      var randX = Math.random() * cc.winSize.width;
      var randY = (Math.random() * (cc.winSize.height - 200)) + 200;
      
      newGear.setPosition(randX, randY);
      newGear.setTag(tag++);
      
      this.addChild(newGear);
      
      this._movingGears.push(newGear);
      this._allGears.push(newGear);
    }
    
    var startGear = new GearSprite(res.GearBlue_png);
    startGear.setEngine(true);
    startGear.setTag(tag++);
    startGear.setPosition(this._spindles[0].getPosition());
    startGear.setSpindle(this._spindles[0]);
    
    startGear.setRotateDirection(ROTATE_DIRECTION.clockWise);
    
    this.addChild(startGear);
    
    this._engineGear = startGear;
    
    this._allGears.push(startGear);
    
    var lastSpindle = this._spindles[this._spindles.length-1];
    
    var finalGear = new GearSprite(res.GearOrange_png);
    finalGear.setTag(tag++);
    finalGear.setPosition(lastSpindle.getPosition());
    finalGear.setSpindle(lastSpindle);
    
    this.addChild(finalGear);
    this._allGears.push(finalGear);
  },
  createListeners:function () {
    var self = this;
    
    var movedGear = null;
  
    cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches : true,
      onTouchBegan: onTouchBegan,
      onTouchMoved: onTouchMoved,
      onTouchEnded: onTouchEnded
    }, this);
    
    function onTouchBegan(touch, event) {
      
      var tap = touch.getLocation();
      
      for(var i = 0; i < self._movingGears.length; i++) {
        
        var currGear = self._movingGears[i];
        var gearRect = currGear.getBoundingBox();
        
        if(cc.rectContainsPoint(gearRect, tap)) {
          movedGear = currGear;
          
          movedGear.setLocalZOrder(0);
          movedGear.setRotateDirection(ROTATE_DIRECTION.none);
          
          movedGear.setSpindle(null);
          
          return true;
        }
      }
      return false;
    }
    
    function onTouchMoved(touch, event) {
      var tap = touch.getLocation();
      
      movedGear.setPosition(tap);
    }
    
    function onTouchEnded(touch, event) {
  
      for(var i = 0; i < self._spindles.length; i++) {
        var currSpindle = self._spindles[i];
        var rectSpindle = currSpindle.getBoundingBox();
        var gearPos = movedGear.getPosition();
        
        
        if(cc.rectContainsPoint(rectSpindle, gearPos)) {
          movedGear.setPosition(currSpindle.getPosition());
          movedGear.setSpindle(currSpindle);
          
          self.checkClutch();
        }
      }
      
    }
  },
  checkClutch:function () {
    var self = this;
    
    var checkedGears = [];
  
    checkedGears.push(this._engineGear.getTag());
    
    clutchGears(this._engineGear);
    
    function clutchGears(engineGear) {
      for(var i = 0; i < self._allGears.length; i++) {
        var currGear = self._allGears[i];
        
        if(checkedGears.indexOf(currGear.getTag()) < 0
              && engineGear.getTag() != currGear.getTag() && currGear.getSpindle() != null) {
          var enginePos = engineGear.getPosition();
          var currGearPos = currGear.getPosition();
  
          var diffX = Math.abs(enginePos.x - currGearPos.x);
          var diffY = Math.abs(enginePos.y - currGearPos.y);
  
          var distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  
          var engineR = engineGear.getContentSize().width/2;
  
          var rectCurrGear = currGear.getContentSize();
  
          var maxR = rectCurrGear.width/2;
          var minR = maxR - CLUTCH_GAP;
    
          if(distance > (engineR + minR) && distance < (engineR + maxR)) {
            engineGear.addDrivenGear(currGear);
            
            if(engineGear.getRotateDirection() == ROTATE_DIRECTION.clockWise) {
              currGear.setRotateDirection(ROTATE_DIRECTION.ctrClockWise);
            } else {
              currGear.setRotateDirection(ROTATE_DIRECTION.clockWise);
            }
    
            currGear.setDriverGear(engineGear);
    
            checkedGears.push(currGear.getTag());
    
            clutchGears(currGear);
          }
        }
        
      }
    }
  }
});

var GearSprite = cc.Sprite.extend({
  ctor:function (img) {
    this._super(img);
  
    this._spindle = null;
    
    this._rotateDirection = ROTATE_DIRECTION.none;
    this._isRotatedGear = false;
    this._isEngine = false;
    
    this._drivenGears = [];
    
    this.scheduleUpdate();
  },
  setSpindle:function (value) {
    this._spindle = value;
  },
  getSpindle:function () {
    return this._spindle;
  },
  setRotateDirection:function (value) {
    this._rotateDirection = value;
  },
  getRotateDirection:function () {
    return this._rotateDirection;
  },
  setEngine:function (value) {
    this._isEngine = value;
  },
  isEngine:function () {
    return this._isEngine;
  },
  addDrivenGear:function (gear) {
    this._drivenGears.push(gear);
  },
  delDrivenGear:function (gear) {
    for(var i = 0; i < this._drivenGears.length; i++) {
      if(this._drivenGears[i].getTag() == gear.getTag()) {
        this._drivenGears.splice(i, 1);
      }
    }
  },
  clearDrivenGears:function () {
    this._drivenGears = [];
  },
  setDriverGear:function (gear) {
    this._driverGear = gear;
  },
  getDriverGear:function () {
    return this._driverGear;
  },
  update:function (dt) {
  
    if(this._rotateDirection == ROTATE_DIRECTION.none) {
      if(this._isRotatedGear == true) {

        this.stopAllActions();
        for(var i = 0; i < this._drivenGears.length; i++) {
          this._drivenGears[i].setRotateDirection(ROTATE_DIRECTION.none);
        }
  
        var driver = this.getDriverGear();
        if(driver) {
          driver.delDrivenGear(this);
        }
        this.clearDrivenGears();
        this.setDriverGear(null);
        
        this._isRotatedGear = false;
      }
    } else if(this._isRotatedGear == false) {
      this._isRotatedGear = true;
      
      var radius = this.getContentSize().width/2;
      
      var angle = ROTATE_SPEED / (2 * Math.PI * radius) * 360;
      
      angle = (this._rotateDirection == ROTATE_DIRECTION.clockWise)? angle : -angle;

      var rotate = new cc.RotateBy(1, angle);
      
      var repeatForever = new cc.RepeatForever(rotate);

      this.runAction(repeatForever);
      
      for(var i = 0; i < this._drivenGears.length; i++) {
        if(this._rotateDirection == ROTATE_DIRECTION.clockWise) {
          this._drivenGears[i].setRotateDirection(ROTATE_DIRECTION.ctrClockWise);
        } else  {
          this._drivenGears[i].setRotateDirection(ROTATE_DIRECTION.clockWise);
        }
      }
    }
  }
});

var UILayer = cc.Layer.extend({
  ctor:function () {
    this._super();
    
    this.createScreen();
  },
  createScreen:function () {
    
    var size = cc.winSize;
    
    var exitButton = new Button("Close", "Меню", function () {
      cc.director.runScene(new MenuScene);
    });
    var buttonSize = exitButton.getContentSize();
    exitButton.setPosition(size.width - buttonSize.width/2, buttonSize.height / 2);
    this.addChild(exitButton);
  
    var restartButton = new Button("Restart", "Рестарт", function () {
      cc.director.runScene(new cc.TransitionShrinkGrow( 2.0, new GameScene() ));
    });
    restartButton.setPosition(buttonSize.width/2, buttonSize.height/2);
    this.addChild(restartButton);
  }
});

var Button = ccui.Button.extend({
  ctor:function (name, caption, callback) {
    this._super();
  
    this.createScreen(name, caption);
    this.createListeners(callback)
  },
  createScreen:function (name, caption) {
    this.loadTextures(res.ButtonNormal_png, res.ButtonSelected_png);
    this.setName(name);
    
    var size = this.getContentSize();
  
    var captionLabel = new cc.LabelTTF(caption, "Arial", 48);
    captionLabel.setPosition(size.width * 0.5, size.height * 0.5);
    this.addChild(captionLabel);
  },
  createListeners:function (callback) {
    this.addTouchEventListener(this.touchEvent(callback), this);
  },
  touchEvent:function (callback) {
    return function (sender, type) {
      if(type == ccui.Widget.TOUCH_ENDED) {
        callback();
      }
    };
  }
});

var GameScene = cc.Scene.extend({
  onEnter:function () {
    this._super();
    
    this.addChild(new BackgroundLayer());
    this.addChild(new TransmissionLayer());
    this.addChild(new UILayer());
  }
});

var MenuLayer = cc.Layer.extend({
  ctor:function () {
    this._super();
    
    this.createScreen();
  },
  createScreen:function () {
    var size = cc.winSize;
    
    var playItem = new MenuItem("Старт", function () {
      cc.director.runScene(new cc.TransitionShrinkGrow( 2.0, new GameScene() ));
    });
    
    var showAbout = new MenuItem("Справка", function () {
      cc.director.runScene(new AboutScene());
    });
  
    this.mainMenu = new cc.Menu(playItem, showAbout);
    this.mainMenu.alignItemsVerticallyWithPadding(30);
    this.mainMenu.setPosition(size.width * 0.5, size.height * 0.5);
    
    this.addChild(this.mainMenu);
  }
});

var MenuItem = cc.MenuItemSprite.extend({
  ctor:function (caption, callback) {
  
    var menuNormal = new cc.Sprite(res.MenuItem_png);
    var menuSelected = new cc.Sprite(res.MenuItem_png);
    
    this._super(menuNormal, menuSelected, null, this.onEvent(callback), this);
  
    this.setScale(1.5);
    
    var size = this.getContentSize();
  
    var playLabel = new cc.LabelTTF(caption, "Arial", 48);
    playLabel.setPosition(size.width * 0.5, size.height * 0.5);
    
    this.addChild(playLabel);
  },
  onEvent:function (callback) {
    return function () {
      // var scale = new cc.ScaleBy(0.5, 1.5);
      //
      // var easeScale = new cc.EaseBackIn (scale);
      //
      // var cbFunc = new cc.callFunc(callback);
      //
      // var secuence = new cc.Sequence(easeScale, cbFunc);
      //
      // this.runAction(secuence);
      callback();
    }
  }
});

var MenuScene = cc.Scene.extend({
  onEnter:function () {
    this._super();
    
    this.addChild(new BackgroundLayer());
    
    this.addChild(new MenuLayer());
  }
});


var AboutLayer = cc.Layer.extend({
  ctor:function () {
    this._super();
    
    this.createScreen();
  },
  createScreen:function () {
    var size = cc.winSize;
    
    var aboutCaption1 = new cc.LabelTTF("Демонстрация работы с фреймворком ", "Arial", 32);
    aboutCaption1.setPosition(size.width/2, size.height/2 + 40);
    aboutCaption1.setColor(new cc.Color(0, 0, 0));
    this.addChild(aboutCaption1);
    
    var aboutCaption2 = new cc.LabelTTF("Cocos2d JS", "Arial", 32);
    aboutCaption2.setPosition(size.width/2, size.height/2);
    aboutCaption2.setColor(new cc.Color(0, 0, 0));
    this.addChild(aboutCaption2);
  
    var aboutCaption3 = new cc.LabelTTF("на примере создания простой игры", "Arial", 32);
    aboutCaption3.setPosition(size.width/2, size.height/2 - 40);
    aboutCaption3.setColor(new cc.Color(0, 0, 0));
    this.addChild(aboutCaption3);
    
    var exitButton = new Button("Close", "Закрыть", function () {
      cc.director.runScene(new MenuScene);
    });
  
    var buttonSize = exitButton.getContentSize();
    exitButton.setPosition(size.width - buttonSize.width/2, buttonSize.height / 2);
    this.addChild(exitButton);
  }
});

var AboutScene = cc.Scene.extend({
  onEnter:function () {
    this._super();
    
    this.addChild(new BackgroundLayer());
    
    this.addChild(new AboutLayer());
  }
});

