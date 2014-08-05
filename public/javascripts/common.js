/**
 * Created by gin on 14-6-16.
 */
if (typeof ErrorCode == 'undefined') {
  var ErrorCode = {
    NO_RESULT : 0,  //没有相关数据
    SUCCESS : 1,  //返回正常
    DATABASE_ERROR : 2, //数据库错误
    PARAM_ERROR : 3,  //参数错误
    PROM_ERROR : 4, //服务端程序异常
    SESSION_TIMEOUT : 5, //Session超时
    IN_PLAN: 6  //功能尚未实现，敬请期待
  };

  var codeDescriptions = ["没有相关数据", "操作成功", "数据库错误", "参数错误", "服务端程序异常", "会话超时", "功能尚未实现，敬请期待"];
}

if (typeof  exports != 'undefined') {
  exports.ErrorCode = ErrorCode;

  exports.CreateResponseBasicJson = function(errorCode) {
    return JSON.stringify({"stat":errorCode, "statDescription":codeDescriptions[errorCode], "datas":{}});
  };
}