var express = require('express');
var router = express.Router();
var common = require('./../public/javascripts/common');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Antinomy' });
});

var os = require('os'),
    path = require('path'),
    fs = require('fs');
var saveTo = "";
router.post('/', function(req, res, next){
  req.busboy.on('file', function(fieldname, file, filename) {
    saveTo = path.join(os.tmpDir(), path.basename(filename));
    console.log(saveTo);
    file.pipe(fs.createWriteStream(saveTo));
  });
  req.busboy.on('field',function (key, value, keyTruncated, valueTruncated) {
    req.body[key] = value;
  });
  req.busboy.on('finish', function(){

    var type = req.body['type'];
    if (type == null || type == 'undefined') {
      res.send(common.CreateResponseBasicJson(common.ErrorCode.IN_PLAN));
      next();
      return;
    }

    var excelParser = require('excel-parser');
    excelParser.parse({
      inFile: saveTo,
      worksheet: 1,
      skipEmpty: true,
      searchFor: {
        term: ['接口名称','接口代码','请求方式','请求路径'],
        type: 'loose'
      }
    }, function(err, worksheets){
      if(err) {
        console.error(err);
      }
      else {
        //格式化数据
        var oriData = [];
        for (var i = 0, len = worksheets.length;i < len; i+=4) {
          var rowDic = {'iName':worksheets[i][1],
            'iCode':worksheets[i+1][1],
            'iMethod':worksheets[i+2][1],
            'iPath':worksheets[i+3][1]};
          oriData.push(rowDic);
        }

        createFile(oriData, type, function(zipFilePath){
          var jsonObj = JSON.parse(common.CreateResponseBasicJson(common.ErrorCode.SUCCESS));

          //路径替换
          zipFilePath = req.protocol + '://' + req.get('host') + zipFilePath.replace(/public/g,"");
          console.log(req.get('host'));
          jsonObj.datas = {"zipPath":zipFilePath};
          res.send(JSON.stringify(jsonObj));
          //删除缓存的文件
          fs.unlink(saveTo,function(e){
            if(e){
              console.log("rmdir Err"+e)
            }
          })
        });
      }
      return;
    });
  });
  req.pipe(req.busboy);
});

var createIOSFilePath = "public/tmp/Objc/";
var createAndroidFilePath = "public/tmp/java/";

function createFile(data, type, callback) {
  var fileName = "NetworkDefine";
  var iosOutZipFile = "public/tmp/ios.zip";
  var androidZipFile = "public/tmp/android.zip";
  var allZipFile = "public/tmp/all.zip";

  var zipFilePath;
  if (type == '0') {
    zipFilePath = iosOutZipFile;
    createIOSFiles(fileName, data, zipFilePath, callback);
  }
  else if (type == '1') {
    zipFilePath = androidZipFile;

    createAndroidFiles(fileName, data, zipFilePath, callback);
  }
  else {
    zipFilePath = allZipFile;

    //如果ios的路径不存在，新建
    if (!fs.existsSync(createIOSFilePath)) {
      if (fs.mkdirSync(createIOSFilePath, 0755)) {
        console.log("createIOSFilePath mkdir Error!");
        return;
      }
    }

    //如果Android的路径不存在，新建
    if (!fs.existsSync(createAndroidFilePath)) {
      if (fs.mkdirSync(createAndroidFilePath, 0755)) {
        console.log("createIOSFilePath mkdir Error!");
        return;
      }
    }
  }
}

function createIOSFiles(fileName, data, zipFileName, callback) {
  var now = new Date();
  //如果ios的路径不存在，新建
  if (!fs.existsSync(createIOSFilePath)) {
    if (fs.mkdirSync(createIOSFilePath, 0755)) {
      console.log("createIOSFilePath mkdir Error!");
      return;
    }
  }

  createHeaderFile(fileName, data, now);
  createImplementationFile(fileName, data, now);
//  createMarcoHeaderFile(fileName, data, now);

  //压缩ios的包
  var archiver = require('archiver');
  var output = fs.createWriteStream(zipFileName);
  var zipArchive = archiver('zip');
  output.on('close', function() {
    console.log('done with the zip', zipFileName);
    //删除临时文件夹
    var rimraf = require("rimraf");
    rimraf(createIOSFilePath, function(error){
      if (error) {
        console.log(error);
      }
      if (callback != null) {
        callback(zipFileName);
      }
    });
  });
  zipArchive.pipe(output);
  zipArchive.bulk([
    { src: [ '**/*' ], cwd: createIOSFilePath, expand: true }
  ]);
  zipArchive.finalize(function(err, bytes) {
    if(err) {
      throw err;
    }
    console.log('done:', base, bytes);
  });
}


function createAndroidFiles(fileName, data, zipFileName, callback) {
  var now = new Date();
  //如果Android的路径不存在，新建
  if (!fs.existsSync(createAndroidFilePath)) {
    if (fs.mkdirSync(createAndroidFilePath, 0755)) {
      console.log("createIOSFilePath mkdir Error!");
      return;
    }
  }

  createJavaFile(fileName, data, now);

  //压缩Android的包
  var archiver = require('archiver');
  var output = fs.createWriteStream(zipFileName);
  var zipArchive = archiver('zip');
  output.on('close', function() {
    console.log('done with the zip', zipFileName);
    //删除临时文件夹
    var rimraf = require("rimraf");
    rimraf(createAndroidFilePath, function(error){
      if (error) {
        console.log(error);
      }
      if (callback != null) {
        callback(zipFileName);
      }
    });
  });
  zipArchive.pipe(output);
  zipArchive.bulk([
    { src: [ '**/*' ], cwd: createAndroidFilePath, expand: true }
  ]);
  zipArchive.finalize(function(err, bytes) {
    if(err) {
      throw err;
    }
    console.log('done:', base, bytes);
  });
}

function createMarcoHeaderFile(fileName, data, date) {
  var fileData = "/**\n" +
      " * @file    " + fileName + ".h\n" +
      " * @brief    网络请求定义\n" +
      " * @author    MRD Automatically Generate\n" +
      " * @version    1.0\n" +
      " * @date " + date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate() + "\n" +
      " * @copyright " + date.getFullYear() +"年 huateng. All rights reserved.\n" +
      " *\n" +
      " * # update （更新日志）\n" +
      " *\n" +
      " * ["+date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate()+"] MRD v0.1\n" +
      " *\n" +
      " * + 创建.\n" +
      " *\n" +
      " */\n" +
      "\n" +
      "#import <Foundation/Foundation.h>\n" +
      "\n";

  //插入宏定义
  fileData += '#ifndef NETWORK_INTERFACE_MARCO\n' +
      '#define NETWORK_INTERFACE_MARCO\n' +
      '\n';

  for (var i = 0; i < data.length; i++) {
    fileData += '/** @name ' + trim(data[i]['iCode']) + '\n' +
        ' *  ' + data[i]['iName'] + '\n' +
        ' *  @{\n' +
        ' */\n' +
        '#define I_' + trim(data[i]['iCode']) + ' @"' + trim(data[i]["iPath"]) + '"\n' +
        '#define I_' + trim(data[i]['iCode']) + '_CODE @"' + trim(data[i]['iCode']) + '"\n' +
        '#define I_' + trim(data[i]['iCode']) + '_NAME @"' + data[i]['iName'] + '"\n' +
        '#define I_' + trim(data[i]['iCode']) + '_METHOD @"' + trim(data[i]['iPath']) + '"\n' +
        '/** @}*/\n\n';
  }

  fileData += '#endif\n';

  //写入
  fs.writeFileSync(createIOSFilePath + fileName + ".h", fileData);
}

function createHeaderFile(fileName, data, date) {
  var fileData = "/**\n" +
      " * @file    " + fileName + ".h\n" +
      " * @brief    网络请求定义\n" +
      " * @author    MRD Automatically Generate\n" +
      " * @version    1.0\n" +
      " * @date " + date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate() + "\n" +
      " * @copyright " + date.getFullYear() +"年 huateng. All rights reserved.\n" +
      " *\n" +
      " * # update （更新日志）\n" +
      " *\n" +
      " * ["+date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate()+"] MRD v0.1\n" +
      " *\n" +
      " * + 创建.\n" +
      " *\n" +
      " */\n" +
      "\n" +
      "#import <Foundation/Foundation.h>\n" +
      "\n";

  //插入宏定义
  fileData += '#ifndef NETWORK_INTERFACE_MARCO\n' +
      '#define NETWORK_INTERFACE_MARCO\n' +
      '\n';
  fileData += '#define ND [HRDNetworkDefine shareInterfaceDefine]\n';
  for (var i = 0; i < data.length; i++) {
    fileData += "#define I_" + trim(data[i]['iCode']) +
        " [HRDNetworkDefine shareInterfaceDefine].i" + data[i]['iCode'] + "\n";
  }
  fileData += '\n#endif\n\n';

  fileData += "@interface NetworkInterface : NSObject\n" +
      "\n" +
      "@property (nonatomic, strong) NSString *code; /**< 接口代码 */\n" +
      "@property (nonatomic, strong) NSString *name; /**< 接口名称 */\n" +
      "@property (nonatomic, strong) NSString *method; /**< 请求方式 */\n" +
      "@property (nonatomic, strong) NSString *path; /**< 请求路径 */\n" +
      "\n" +
      "@end\n" +
      "\n" +
      "@interface HRDNetworkDefine : NSObject\n";

  //插入接口定义
  for (var i = 0; i < data.length; i++) {
    fileData += "@property (nonatomic, strong, readonly) NetworkInterface *i" + trim(data[i]['iCode']) + ";\t " +
        "/**< " + data[i]['iName'] + " */\n";
  }

  fileData += "\n/**\n" +
      " *  返回网络接口定义的单例\n" +
      " *\n" +
      " *  @return HRDNetworkDefine Object\n" +
      " */\n" +
      "+ (instancetype)shareInterfaceDefine;\n" +
      "\n" +
      "@end";

  //写入
  fs.writeFileSync(createIOSFilePath + fileName + ".h", fileData);
}

function createImplementationFile(fileName, data, date) {
  var fileData = "/**\n" +
      " * @file    "+ fileName +".m\n" +
      " * @brief    网络请求定义\n" +
      " * @author    MRD Automatically Generate\n" +
      " * @version    1.0\n" +
      " * @date " + date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate() + "\n" +
      " * @copyright " + date.getFullYear() + "年 huateng. All rights reserved.\n" +
      " *\n" +
      " * # update （更新日志）\n" +
      " *\n" +
      " * ["+date.getFullYear() + "-" + (parseInt(date.getMonth())+1) + "-" + date.getDate()+"] MRD v0.1\n" +
      " *\n" +
      " * + 创建.\n" +
      " *\n" +
      " */\n" +
      "\n" +
      "#import \"" + fileName + ".h\"\n" +
      "\n" +
      "@implementation NetworkInterface\n\n" +
      "- (NSString *)description {\n" +
      '  return [NSString stringWithFormat:@"%@\\n接口代码:%@\\n接口名称:%@\\n接口方式:%@\\n接口路径:%@\\n",[super description],self.code, self.name, self.method, self.path];\n' +
      '}\n\n' +
      "@end\n\n" +
      "@implementation HRDNetworkDefine\n\n" +
      "+ (instancetype)shareInterfaceDefine {\n" +
      "  static HRDNetworkDefine *define = nil;\n" +
      "  static dispatch_once_t onceTokenNetworkDefine;\n" +
      "  dispatch_once(&onceTokenNetworkDefine, ^{\n" +
      "    if (!define) {\n" +
      "      define = [[HRDNetworkDefine alloc] initPrivate];\n" +
      "    }\n" +
      "  });\n" +
      "  return define;\n" +
      "}\n" +
      "\n" +
      "- (instancetype)init {\n" +
      "  @throw [NSException exceptionWithName:@\"Singleton\" reason:@\"Use +[HRDNetworkDefine shareInterfaceDefine]\" userInfo:nil];\n" +
      "  return nil;\n" +
      "}\n" +
      "\n" +
      "- (instancetype)initPrivate {\n" +
      "  if (self = [super init]) {\n";
  //插入接口的具体数据
//  for (var i = 0; i < data.length; i++) {
//    fileData += "    _i" + data[i]["iCode"] + " = [[NetworkInterface alloc] init];\n" +
//        "    _i" + trim(data[i]["iCode"]) + ".code = @\"" + trim(data[i]["iCode"]) +"\";\n" +
//        "    _i" + trim(data[i]["iCode"]) + ".name = @\"" + data[i]["iName"] +"\";\n" +
//        "    _i" + trim(data[i]["iCode"]) + ".method = @\"" + trim(data[i]["iMethod"]) +"\";\n" +
//        "    _i" + trim(data[i]["iCode"]) + ".path = @\"" + data[i]["iPath"] +"\";\n\n"
//  }

  fileData += "  }\n" +
      "  return self;\n" +
      "}\n\n";
  for (var i = 0; i < data.length; i++) {
    //Get
    fileData += '- (NetworkInterface *)i' + trim(data[i]["iCode"]) + ' {\n' +
        '  @autoreleasepool {\n' +
        '    NetworkInterface *interface_' + trim(data[i]["iCode"]) + ' = [[NetworkInterface alloc] init];\n' +
        '    interface_' + trim(data[i]["iCode"]) + '.code = @"' + trim(data[i]["iCode"]) + '";\n' +
        '    interface_' + trim(data[i]["iCode"]) + '.name = @"' + data[i]["iName"] + '";\n' +
        '    interface_' + trim(data[i]["iCode"]) + '.method = @"' + trim(data[i]["iMethod"]) + '";\n' +
        '    interface_' + trim(data[i]["iCode"]) + '.path = @"' + trim(data[i]["iPath"]) + '";\n' +
        '    return interface_' + trim(data[i]["iCode"]) + ';\n' +
        '  }\n' +
        '}\n\n';
    //Set
//    fileData += '- (void)setI' + trim(data[i]["iCode"]) + ':(NetworkInterface *)i' + trim(data[i]["iCode"]) + ' {\n' +
//        '  _i' + trim(data[i]["iCode"]) + ' = nil;\n' +
//        '}\n\n';
  }
  fileData += "@end";
  //写入
  fs.writeFileSync(createIOSFilePath + fileName + ".m", fileData);
}

function createJavaFile(fileName, data, now) {
  console.log(data);
  var fileData = 'package ?;\n' +
      '\n' +
      'public class NetWorkInterface {\n';
  //插入接口定义
  for (var i = 0; i < data.length; i++) {
    fileData += '	/**\n' +
        '	 * ' + data[i]['iName'] +
        '\n' +
        '	 */\n' +
        '	public static BaseInterface i' + trim(data[i]['iCode']) + ' = new BaseInterface("' + trim(data[i]['iCode'])
    + '", "' + data[i]['iName'] + '", "' + trim(data[i]['iMethod']) + '", "' + data[i]['iPath'] + '");\n';
  }
  fileData += '\n	public static class BaseInterface {\n' +
      '\n		/**\n' +
      '		 * 接口代码\n' +
      '		 */\n' +
      '		private String code;\n\n' +
      '		/**\n' +
      '		 * 接口名称\n' +
      '		 */\n' +
      '		private String name;\n' +
      '\n' +
      '		/**\n' +
      '		 * 请求方式\n' +
      '		 */\n' +
      '		private String method;\n' +
      '\n' +
      '		/**\n' +
      '		 * 请求路径\n' +
      '		 */\n' +
      '		private String path;\n' +
      '\n' +
      '		private BaseInterface(String code, String name, String method, String path) {\n' +
      '			this.code = code;\n' +
      '			this.name = name;\n' +
      '			this.method = method;\n' +
      '			this.path = path;\n' +
      '		}\n' +
      '\n' +
      '		public String getCode() {\n' +
      '			return code;\n' +
      '		}\n' +
      '\n' +
      '		public String getName() {\n' +
      '			return name;\n' +
      '		}\n' +
      '\n' +
      '		public String getMethod() {\n' +
      '			return method;\n' +
      '		}\n' +
      '\n' +
      '		public String getPath() {\n' +
      '			return path;\n' +
      '		}\n' +
      '	}\n' +
      '}'
  //写入
  fs.writeFileSync(createAndroidFilePath + fileName + ".java", fileData);
}

function trim(str){
  str = str.replace(/^(\s|\u00A0)+/,'');
  for(var i=str.length-1; i>=0; i--){
    if(/\S/.test(str.charAt(i))){
      str = str.substring(0, i+1);
      break;
    }
  }
  return str;
}

module.exports = router;
