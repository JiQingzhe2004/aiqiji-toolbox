// Font Awesome 配置文件
import { library } from '@fortawesome/fontawesome-svg-core';
import { config } from '@fortawesome/fontawesome-svg-core';

// 告诉 Font Awesome 不要自动添加 CSS，我们使用 Tailwind
config.autoAddCss = false;

// 导入需要的品牌图标
import {
  faApple,
  faAndroid, 
  faMicrosoft,
  faLinux,
  faChrome,
  faFirefox,
  faSafari,
  faEdge,
  faInternetExplorer
} from '@fortawesome/free-brands-svg-icons';

// 导入需要的实心图标
import {
  faDesktop,
  faMobile,
  faTablet,
  faMobileButton
} from '@fortawesome/free-solid-svg-icons';

// 将图标添加到库中，这样可以按需加载
library.add(
  // 品牌图标
  faApple,
  faAndroid,
  faMicrosoft,
  faLinux,
  faChrome,
  faFirefox,
  faSafari,
  faEdge,
  faInternetExplorer,
  // 设备图标
  faDesktop,
  faMobile,
  faTablet,
  faMobileButton
);

export {
  // 品牌图标
  faApple,
  faAndroid,
  faMicrosoft,
  faLinux,
  faChrome,
  faFirefox,
  faSafari,
  faEdge,
  faInternetExplorer,
  // 设备图标
  faDesktop,
  faMobile,
  faTablet,
  faMobileButton
};
