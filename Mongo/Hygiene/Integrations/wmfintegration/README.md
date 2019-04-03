
# WMF's INTERGRATION LAYER

### INSTALLATION
``` sh
    npm install git+https://bitbucket.org/amankareem/wmfintegration.git --save
```

### SET UP
```sh
    var wmfIntergration = require("wmfintegration");
    wmfIntergration = new wmfIntergration();
    wmfIntergration.init(process.env, logger);
```