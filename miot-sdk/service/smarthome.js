/**
 * @export public
 * @doc_name 智能家庭模块
 * @doc_index 5
 * @doc_directory service
 * @module miot/service/smarthome
 * @description 智能家庭 API
 *
 */
//@native
import native from "../native";
/**
 * 成员类型
 * @namespace MemberType
 */
export const MemberType = {
    /**
     * 人
     * @const
     */
    Person: "person",
    /**
     * 宠物
     * @const
     */
    Pet: 'pet'
};
Object.freeze(MemberType)
export default {
    /**
     * @typedef {Object} UserInfo
     * @property {number} uid user id; since 10010
     * @property {string} nickName user nick name
     * @property {string} avatarURL user avatarURL
     */
    /**
     * 获取用户的昵称和头像信息
     * @deprecated 已废弃，请使用 Service.account.getAccountInfoById 方法
     * @param {*} uid 获取用户信息的uid或者手机号
     * @returns {Promise<UserInfo>} 用户信息
     */
    getUserInfo(uid) {
        //@native :=> promise {}
        return new Promise((resolve, reject) => {
            native.MIOTService.loadAccountInfo(uid,
                (status, resp) => {
                    if (status && resp) {
                        console.log("rep:", resp)
                        //iOS 下获取某用户信息为直接透传，因此有时为nickname
                        resolve({ nickName: resp.nickname || resp.nickName, avatarURL: resp.avatarURL, uid: resp.currentAccountID2 || resp.userid || resp.id })
                    } else {
                        reject({ ok: false, message: "" })
                    }
                });
        })
        //@native end
    },
    /**
     * 通过UID批量获取用户信息
     * @deprecated 已废弃，请使用 Service.account.getAccountInfoList 方法
     * @since 10005
     * @param {Array<string>} uids uid数组，仅支持uid，不支持手机号查询
     * @return {Promise<object[]>}
     * @example
     * Service.smarthome.getUserInfoList([uid1,uid2]).then(res => {
     *  console.log('user info :', res.list)
     * })
     */
    getUserInfoList(uids) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/profiles", { uids }, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * @typedef GPSInfo
     * @property lng - 经度
     * @property lat - 维度
     * @property adminArea - 省
     * @property countryCode - 国家代号（CN等）
     * @property locality - 城市
     * @property thoroughfare - 街道
     * @property language - 语言代号（zh_CN等）
     * @property subLocality - 区
     */
    /**
     * 上报gps信息 /location/set
     * @param {string} deviceID 设备ID
     * @param {GPSInfo} gpsInfo {lng,lat,countryCode,adminArea,locality,subLocality,thoroughfare,language} 依次为 {，，，，，，，}
     * @returns {Promise<object>}
     * @example
     * //获取手机地理信息，iOS必须是真机且开启定位权限
     * Host.locale.getLocation().then(res => {
     *  console.log('get location: ', res)
     *  var {longitude,latitude} = res;
     * })
     * if (latitude && longitude) {
     *  Service.smarthome.reportGPSInfo(Device.deviceID, {})
     * }
     *
     */
    reportGPSInfo(deviceID, gpsInfo) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/location/set", { ...gpsInfo, did: deviceID }, (ok, res) => {
                ok && resolve(res || true);
                !ok && reject(res);
            })
        })
        //@native end
    },
    //@native begin
    /**
     * @typedef WeatherInfo
     * @property city - 城市名称
     * @property city_id - 城市ID
     * @property pub_time - 发布时间
     * @property aqi - 空气指数
     * @property pm25 - PM2.5
     * @property pm10 - PM1.0
     * @property so2 - 二氧化硫
     * @property no2 - 二氧化氮
     * @property src - 数据来源，eg：中国环境监测总站
     */
    /**
     * 获取天气 /location/weather
     * 该API 改为私有
     * @param {string} deviceID 设备ID
     * @returns {Promise<WeatherInfo>}
     *
     */
    getWeatherInfo(deviceID) {
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/location/weather", { did: deviceID }, (ok, res) => {
                if (ok && res.aqi) {
                    return resolve(res.aqi);
                }
                reject(res);
            })
        });
    },
    //@native end
    /**
     * 设备固件版本信息
     * @typedef DeviceVersion
     * @property {boolean} isUpdating - 是否ota升级中 为true时，otaState才有效
     * @property {boolean} isLatest - 是否是最新版本
     * @property {boolean} isForce - 是否强制升级
     * @property {boolean} hasNewFirmware - 是否有新固件
     * @property {string} curVersion - 当前固件版本
     * @property {string} newVersion - 新固件版本
     * @property {string} description - 描述
     * @property {OTAState} otaState -设备OTA状态， since 10011
     *
     */
    /**
     * 设备固件otaState
     * @since 10011
     * @typedef OTAState
     * @param {string} state ota 状态
     * @param {number} startTime 开始时间
     * @param {number} progress 进度
     * @param {string} failedReason 失败原因
     * @param {number} failedCode   失败code
     */
    /**
     * 获取指定设备的新版本信息
     * /home/checkversion
     * @method
     * @param  {string} 设备did
     * @param  {number} pid 设备类型，使用Device.type,即可
     * @returns {Promise<DeviceVersion>}
     * @example
     * Device.getDeviceWifi().checkVersion()
     *  .then(res => console.log('success:', res))
     *  .catch(err => console.log('failed:', err))
     */
    checkDeviceVersion(did, pid) {
        //@native :=> promise {}
        return new Promise((resolve, reject) => {
            //const { did, pid } = Properties.of(this)
            native.MIOTRPC.standardCall("/home/checkversion", { did, pid }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                const { updating, isLatest, description, force, curr, latest, ota_start_time, ota_progress, ota_failed_code, ota_failed_reason, ota_status } = res;
                resolve({
                    isUpdating: updating, isLatest, isForce: force, description,
                    curVersion: curr, newVersion: latest, hasNewFirmware: updating ? false : !isLatest,
                    otaState: { state: ota_status, startTime: ota_start_time, progress: ota_progress, failedCode: ota_failed_code, failedReason: ota_failed_reason }
                })
            });
        });
        //@native end
    },
    // @native begin
    getProtocolUrls(params) {
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/plugin/get_protocol", params, (ok, res) => {
                if (ok) {
                    return resolve(res);
                }
                reject(res);
            });
        });
    },
    // @native end
    //@native begin
    getAreaPropInfo(params) {
        // 有限公开
        // 获取某指定地区天气环境等信息
        // /location/area_prop_info
        // { "longitude": "116.3249176", "latitude": "40.0365709" }
        // { "area_id": "101280601" }
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/location/area_prop_info", params, (ok, res) => {
                if (ok) {
                    return resolve(res);
                }
                reject(res);
            })
        });
    },
    //@native end
    /**
     * // 获取可用固件更新，传参为dids。 /home/multi_checkversion
     * @param {array<string>} deviceIDs 设备ID
     * @return {Promise<json>}
     */
    getAvailableFirmwareForDids(deviceIDs) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            var resultHandler = (ok, res) => {
                console.log("res:", res)
                if (!ok || res == null) {
                    return reject(res);
                }
                if (res.list) {
                    //Android获取的接口数据在list字段下
                    res = res.list;
                }
                if (res instanceof Array) {
                    var result = []
                    for (var i = 0; i < res.length; i++) {
                        var item = res[i];
                        if (native.isIOS) {
                            const { updating, isLatest, desp, force, currentVersion, latest } = item;
                            result.push({
                                isUpdating: updating, isLatest, isForce: force, description: desp,
                                curVersion: currentVersion, newVersion: latest,
                                hasNewFirmware: updating ? false : !isLatest
                            })
                        } else {
                            const { updating, isLatest, description, force, curr, latest } = item;
                            result.push(
                                {
                                    isUpdating: updating, isLatest, isForce: force, description,
                                    curVersion: curr, newVersion: latest,
                                    hasNewFirmware: updating ? false : !isLatest
                                }
                            );
                        }
                    }
                    resolve(result)
                } else {
                    const { updating, isLatest, description, force, curr, latest } = res;
                    resolve(
                        {
                            isUpdating: updating, isLatest, isForce: force, description,
                            curVersion: curr, newVersion: latest,
                            hasNewFirmware: updating ? false : !isLatest
                        }
                    );
                }
            };
            if (native.isIOS) {
                native.MIOTHost.getAvailableFirmwareForDids(deviceIDs, resultHandler)
                return
            }
            native.MIOTRPC.standardCall("/home/multi_checkversion", { "dids": deviceIDs }, resultHandler);
        });
        //@native end
    },
    /**
     * 获取服务器中 最新的版本信息，内部调用米家代理接口/home/latest_version
     * @deprecated 请使用下面的getLatestVersionV2
     * @param {string} model 设备的 model
     * @return {Promise}
     */
    getLatestVersion(model) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/latest_version", { model }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取服务器中 最新的版本信息，
     * 内部调用米家代理接口/v2/device/latest_ver
     * @since 10004
     * @param {string} did 设备did
     */
    getLatestVersionV2(did) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/device/latest_ver", { did }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 添加一条日志打点。
     * 开发者应该在拓展程序内合适时机调用该接口，打点信息会自动写入文件，按 Model 归类，即一个 Model 生成一个日志文件。
     * 当用户反馈问题时，勾选 “同时上传日志”，则该 Model 的日志会跟随用户反馈上传，
     * 开发者可在 IoT 平台查看用户反馈及下载对应日志文件。用户反馈查看入口：数据中心—用户反馈，如果看不到数据中心入口，联系自己所属企业管理员修改账号权限。
     * 查看地址：https://iot.mi.com/fe-op/operationCenter/userFeedback
     * @param {string} model 要打 log 到哪个 model 下
     * @param {string} log 具体的 log 数据
     * @returns {void}
     *
     * @example
     *     Service.smarthome.reportLog("a.b.c", "hello");
     *     Service.smarthome.reportLog(Device.model, `[info]test value is :${v1},${v2},${v3}`)
     *     Package.isDebug&&Service.smarthome.reportLog(...)
     *
     */
    reportLog(model, log) {
        //@native begin
        // model = (typeof(model)=="string")?model:(model?model.model:null)
        if (!model) return;
        //直接执行, 无返回
        native.MIOTService.addLog(model, log + "");
        //@native end
    },
    /**
     * 上报设备数据 /device/event
     * 会更新状态+存到历史(相当于调用setDeviceData 接口)+触发自动化
     * @param {string} deviceID 设备ID
     * @param {array<map>} records [{type,key,value}] 其中：type为'prop'或'event'，key，value均为自定义string
     *
     * @example
     * Service.smarthome.reportRecords("deviceID", [{type:"prop",key:"b",value:"c"}])
     */
    reportRecords(deviceID, records) {
        //@native :=> promise null
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/device/event", { did: deviceID, datas: records }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * /v2/device/set_extra_data
     *  写extra_data 字段，必须为map[string] string格式
     * @since 10002
     * @deprecated 10005 不推荐使用，后续版本会移除该方法。建议使用batchSetDeviceDatas
     * @param {json} params  -参数 {did, extra_data}
     * @return {Promise}
     */
    deviceSetExtraData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            console.warn("deviceSetExtraData was deprecated since 10005, use batchGetDeviceDatas instead。")
            native.MIOTRPC.standardCall("/v2/device/set_extra_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 通过前缀分批拉取设备的配置信息
     * - /v2/device/range_get_extra_data
     * @deprecated 10005 开始废弃， 后续版本会移除该方法。推荐使用 batchGetDeviceDatas
     * @param {json} params {did:string,prefix:string,limit:int,offset:int}
     * @return {Promise<json>}
     */
    getDevicesConfig(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            console.warn("getDevicesConfig was deprecated since 10005, use batchGetDeviceDatas instead。")
            native.MIOTRPC.nativeCall("/v2/device/range_get_extra_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 删除设备上传的信息 /v2/device/del_extra_data
     * @deprecated 10005 开始废弃， 后续版本会移除该方法。batchSetDeviceDatas 设置的属性会随着设备删除自动清空
     * @param {json} params {did:string, keys:[key1,key2]}
     * @return {Promise<json>}
     */
    delDevicesConfig(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            console.warn("delDevicesConfig was deprecated since 10005, this function will no longer support。")
            native.MIOTRPC.nativeCall("/v2/device/del_extra_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取设备时区
     * @deprecated 10005, 内部取用extra_Data 中设置的数据，建议自行在batchSetDeviceData中实现
     * @param {string} did
     */
    getDeviceTimeZone(did) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/device/get_extra_data", { did: did, keys: ["timezone"] }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            })
        });
        //@native end
    },
    /**
     * 提供返回设备数据统计服务，使用该接口需要配置产品model以支持使用，建议找对接的产品人员进行操作。
     * 图表📈统计接口 /v2/user/statistics
     * 注:由于sds限额问题，可能会出现一次拉不到或者拉不完数据的情况，会返回code:0和message:“sds throttle”
     * @param {object} params
     * @param {string} params.did did
     * @param {string} params.data_type 数据类型 包括： 采样统计 日统计:stat_day_v3 / 周统计:stat_week_v3 / 月统计:stat_month_v3;
     * @param {string} params.key 需要统计的字段，即统计上报对应的key
     * @param {number} params.time_start 开始时间
     * @param {number} params.time_end 结束时间
     * @param {number} params.limit 限制次数，0为默认条数
     * @return {Promise<Object>}
     {
        "code": 0,
        "message": "ok",
        "result": [
            {
                "value": "[12,34]", // 为一个数组形式json串
                "time": 1543593600 // 时间戳
            },
            {
                "value": "[10,11]",
                "time": 1541001600
            }]
    }
     */
    getUserStatistics(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/user/statistics", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取支持语音的设备 可以控制的设备列表。 /voicectrl/ai_devs
     * @param deviceID  语音设备的 did
     * @return {Promise}
     */
    getVoiceCtrlDevices(deviceID) {
        return this.getVoiceVtrlDevices(deviceID);
    },
    getVoiceVtrlDevices(deviceID) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall('/voicectrl/ai_devs', { "did": deviceID }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取小爱接口数据，内部调用米家代理接口/v2/api/aivs
     * @param {json} params 请求参数 {path:string,params:map,header:map,payload:map,env:int,req_method:string,req_header:map}
     * @param {string} params.path
     * @param {string} params.params
     * @param {string} params.params.did
     * @param {string} params.params.client_id
     * @param {string} params.header
     * @param {string} params.env
     * @param {string} params.req_method
     * @param {string} params.req_header
     * @return {Promise}
     * @example
     * Service.smarthome.getAiServiceProxy({
     *  path: "/api/aivs/xxx",
     *  params: { did : "xx", client_id: "xx"},
     *  header: { name : "xx"},
     *  env: 1,
     *  req_method: "POST",
     *  req_header: {"Content-Type":"xx"}
     * }).then()
     */
    getAiServiceProxy(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/api/aivs", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取服务器中 device 对应的数据，内部调用米家代理接口 /device/getsetting
     * @deprecated 10010 开始废弃， 后续版本会移除该方法。 推荐使用 getDeviceSettingV2
     * @param {object} params 请求参数
     * @param {string} params.did did
     * @param {Array<string>} params.settings 指定设置的key数组
     * @return {Promise}
     */
    getDeviceSetting(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            console.warn("getDeviceSetting was deprecated since 10010, use getDeviceSettingV2 instead.")
            native.MIOTRPC.nativeCall("/device/getsetting", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取服务器中 device 对应的数据，内部调用米家代理接口 /v2/device/getsettingv2
     * @since 10010
     * @param {object} params
     * @param {string} params.did   设备did
     * @param {string} params.last_id   上一次请求返回的id，用于分页
     * @param {string} params.prefix_filter filter
     * @param {Array<string>} params.settings 指定设置的key数组
     * @return {Promise}
     */
    getDeviceSettingV2(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/device/getsettingv2", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 设置服务器中 device 对应的数据，内部调用米家代理接口/device/setsetting
     * @param {object} params 请求参数 {did:string,settings:map<key,value>}
     * @param {string} params.did did
     * @param {object} params.settings 指定设置的key数组
     * @return {Promise}
     */
    setDeviceSetting(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall('/device/setsetting', params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 删除服务器中 device 对应的数据，内部调用米家代理接口/device/delsetting
     * @param {json} params  - 请求参数
     * @param {string} params.did did
     * @param {object} params.settings 指定要删除的key数组
     * @return {Promise}
     */
    delDeviceSetting(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/device/delsetting", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 添加设备属性和事件历史记录，/user/set_user_device_data
     * 对于蓝牙设备，params.key 可参考文档  https://iot.mi.com/new/guide.html?file=04-嵌入式开发指南/06-BLE产品接入/06-米家BLE%20Object定义#/
     * @param {object} params  参数
     * @param {string} params.did 设备did，
     * @param {string} params.uid 添加到哪个用户下,一般为 Device.ownerId，
     * @param {string} params.type 属性为prop, 事件为event
     * @param {string} params.key 要保存的数据K, 属性或事件名，(注意：如果设备是蓝牙设备，传入的是object id， 且为十进制数据；如果是wifi设备，才传入自定义属性或事件名，可以在开发者平台-产品-功能定义中查看)
     * @param {string} params.value 要保存的数据V
     * @param {number} params.time 触发时间戳，
     * @return {Promise}
     */
    setDeviceData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/set_user_device_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 查询用户名下设备上报的属性和事件
     * 获取设备属性和事件历史记录，订阅消息直接写入到服务器，不需要插件添加.
     * 通下面的set_user_device_data的参数一一对应， /user/get_user_device_data
     * 对于蓝牙设备，params.key 可参考文档  https://iot.mi.com/new/guide.html?file=04-嵌入式开发指南/06-BLE产品接入/06-米家BLE%20Object定义#/
     *
     * @param {json} params -参数\{did,type,key,time_start,time_end,limit}含义如下：
     * @param {string} params.did 设备id。 必选参数
     * @param {string} params.uid 要查询的用户id 。必选参数
     * @param {string} params.key 属性或事件名，必选参数。(注意：如果设备是蓝牙设备，传入的是object id， 且为十进制数据；如果是wifi设备，才传入自定义属性或事件名，可以在开发者平台-产品-功能定义中查看)，如果是miot-spec设备，请传入（siid.piid或者siid.eiid）
     * @param {string} params.type 必选参数[prop/event], 如果是查询上报的属性则type为prop，查询上报的事件则type为event,
     * @param {string} params.time_start 数据起点。必选参数
     * @param {string} params.time_end 数据终点。必选参数，time_end必须大于time_start,
     * @param {string} params.group 返回数据的方式，默认raw,可选值为hour、day、week、month。可选参数.
     * @param {string} params.limit 返回数据的条数，默认20，最大1000。可选参数.
     * @returns {Promise}
     */
    getDeviceData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/get_user_device_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 删除用户的设备信息（prop和event 除外）.
     * 删除对应时间戳的上报的数据，无法删除type为prop和event,删除后可用get_user_device_data校验。
     * 如果get_user_device_data校验返回的为[]表示删除成功。
     * user/del_user_device_data
     * @since 10004
     * @param {object} params {did:'', type: '', key:'',time:number} did:设备ID ;type: 要删除的类型 ;key: 事件名称. motion/alarm ;time:时间戳，单位秒
     * @param {string} params.did 设备id。 必选参数
     * @param {string} params.type type 定义与SDS表中type一致。必选参数。可参考SDS文档中的示例：https://iot.mi.com/new/doc/08-%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97/03-%E5%AD%98%E5%82%A8/02-%E6%95%B0%E6%8D%AE%E5%AD%98%E5%82%A8-SDS.html?h=del_user_device_data
     * @param {string} params.key key 事件名，可自定义,定义与SDS表中key一致。必选参数
     * @param {string} params.time 指定时间戳
     * @param {string} params.value 指定值
     */
    delDeviceData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/del_user_device_data", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 用于按照时间顺序拉取指定uid,did的发生的属性事件
     * /v2/user/get_user_device_log
     * @since 10004
     * @param {object} params 参数
     * @param {string} params.did
     * @param {number} params.limit         目前最大为50
     * @param {number} params.time_start    开始时间
     * @param {number} params.time_end      结束时间
     */
    getUserDeviceLog(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/user/get_user_device_log", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取用户收藏
     * /user/get_user_coll
     * @param {object} params 参数
     * @param {string} params.did did
     * @return {Promise}
     */
    getUserColl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/get_user_coll", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 设置用户收藏
     * /user/get_user_coll
     * @param {object} params 参数
     * @param {string} params.did did
     * @param {string} params.name name
     * @param {string} params.content content
     * @return {Promise}
     */
    setUserColl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/set_user_coll", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * /user/edit_user_coll
     *  编辑用户收藏
     * @since 10002
     * @param {json} params  -参数 {coll_id, newname， content}
     * @return {Promise}
     */
    editUserColl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/edit_user_coll", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 删除用户收藏
     * /user/get_user_coll
     * @param {*} params 参数
     * @param {string} params.did did
     * @param {string} params.coll_id coll_id
     * @return {Promise}
     */
    delUserColl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/del_user_coll", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 石头扫地机专用
     * 添加设备属性和事件历史记录，/home/getmapfileurl
     * @param {json} params
     * @return {Promise}
     */
    getMapfileUrl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/getmapfileurl", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 石头扫地机器人专用，获取fds存储文件url
     *  /home/getrobomapurl
     *
     * @param {*} arams {“obj_name”:”xxx/12345678/87654321/1.0”}，obj_name格式为:fds存储文件夹/did/uid/obj_name
     * @return {Promise}
     */
    getRobomapUrl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/getrobomapurl", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 石头扫地机器人专用，撤销隐私时删除扫地机地图
     *  /user/del_user_map
     *
     * @param {json} params {did} 设备ID
     * @return {Promise}
     */
    delUsermap(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/del_user_map", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 添加设备属性和事件历史记录，/home/device_list
     * 当ssid和bssid均不为空时，表示同时搜索这个局域网内所有未被绑定过的设备
     * @param {json} params {pid:string ,ssid:string ,bssid:string ,localDidList:array<string>,checkMoreWifi:bool,dids:array<string>}
     * @param {string} params.pid               Device.type
     * @param {string} params.ssid              wifi 的 ssid
     * @param {string} params.bssid             wifi 的bssid
     * @param {string} params.dids              要拉取列表的设备的didi，如果为空表示所有设备
     * @param {string} params.localDidList      本地设备did列表，补充ssid和bssid的本地查询条件，会与ssid查到的本地列表一起返回其中未被绑定的在线设备
     * @param {string} params.checkMoreWifi     检查2.4gwifi下的本地设备列表
     * @param {boolean} params.getHuamiDevices  获取华米设备,如华米手环
     * 其中，pid：设备PID，ssid：wifi名称，bssid：wifi网关mac，locatDidList：本地设备did列表，补充ssid和bssid的本地查询条件，会与ssid查到的本地列表一起返回其中未被绑定的在线设备，checkMoreWifi：检查2.4gwifi下的本地设备列表，did：要拉取列表的设备的did，如果为空表示所有设备
     * @return {Promise}
     */
    getHomeDevice(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            //iOS 端getHuamiDevices 参数皆为true，如果不设置，默认使用true
            native.MIOTRPC.standardCall("/home/device_list", { 'getHuamiDevices': true, ...params }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取AppConfig配置文件，1. 插件端有一些自己的信息需要配置，可使用此接口 2. 局限性：只有小米内部有权配置，之后可能会出对外版（目前只能找米家产品经理/工程师帮忙配置）
     *  **维护起来很不方便，不建议使用。**
     * 默认获取的是release版数据， 如果需要获取preview版数据， 可以在米家APP中 我的-->开发者设置-->其他设置的界面中 “AppConfig接口拉取preview版数据”  置为选中状态
     * @param {object} params 请求参数
     * @param {string} params.name configName 配置的名字
     * @param {string} params.lang lang 可选: zh_CN、zh_TW、en，zh-hant，一般请使用zh_CN和en
     * @param {string} params.result_level  正常传"0"，若传“1”，则会提供一个downloadurl，而不是直接返回content，以节省流量。取得downloadurl后，通过Host.file.downloadFile下载文件，然后使用
     * @param {string} params.version version 后台配置的version，大概率为"1"，如果不对，可以找米家工程师帮忙查询，查询地址：http://plato.io.mi.srv/#/appconfig/client
     */
    getAppConfig(params) {
        //@native :=> promise
        if (params && params.name) {
            let isPreview = (native.MIOTHost.appConfigEnv === 1 ? true : false);
            params.name = isPreview ? params.name + "_preview" : params.name;
        }
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/service/getappconfig", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 用于获取插件所需的一些默认配置信息
     * @deprecated 10010, SDKLevel 10010 废弃该接口，使用getAppConfig
     * @param {json} params {'name':'自定义值','lang':'自定义值','version':'自定义值','model':'modelId'}
     * /service/getappconfigv2
     */
    getAppConfigV2(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/service/getappconfigv2", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取设备所在网络的IP地址所属国家
     * /home/getcountry
     * @param {json} params {"dids": ["xx"]}
     * @return {Promise}
     */
    getCountry(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/getcountry", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取蓝牙锁绑定的时间，/device/blelockbindinfo
     *
     * @param {json} params  -参数
     * @param {string} params.did  did
     * @return {Promise}
     */
    getBleLockBindInfo(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/device/blelockbindinfo", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取设备的属性，属性设置会在设备被删除时清空
     * api call /device/batchdevicedatas
     *
     * error code:
     * 0 - 成功
     * -7 - 没有找到注册的设备
     * -6 - 设备对应uid不为0
     * -4 - server err
     *
     * @since 10005
     * @param {object[]} params  -参数
     * @param {string} params[].did did
     * @param {string[]} params[].props props 列表,属性需要以"prop.s_"开头 e.g ["prop.s_aaa","prop.s_bbb"]
     * @return {Promise}
     * @example
     * let params = {'did':Device.deviceID, 'props': [
     *  "prop.s_push_switch"
     * ]}
     * Service.smarthome.batchGetDeviceDatas([params]).then(...)
     *
     *
     */
    batchGetDeviceDatas(params) {
        //@native :=> promise
        return this.batchGetDeviceProps(params);
        //@native end
    },
    /**
     * 设置设备属性, 属性设置会在设备被删除时清空
     * 备注： props最多20个，最多同时300个设备（目前max设备数)，属性需要以prop.s_ 开头
     *
     * error code:
     * 0 - 成功
     * 7 - 没有找到注册的设备
     * 6 - 设备对应uid为0
     * 4 - server err
     *
     * @since 10005
     * @param {object[]} params {did: string, props: json}
     * @param {string} params[].did did
     * @param {object} params[].props props 键值对， 属性需要以"prop.s_"开头
     * @example
     * let params = {'did':Device.deviceID, 'props': {
     *  "prop.s_push_switch_xxx":"0"
     * }}
     * Service.smarthome.batchSetDeviceDatas([params]).then(...)
     *
     */
    batchSetDeviceDatas(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/device/batch_set_props", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 设置设备属性，e.g 配置摄像头/门铃设备的属性
     * props最多20个, 属性需要以"prop.s_"开头。
     *
     * error code:
     * 0 - 成功
     * -7 - 没有找到注册的设备
     * -6 - 设备对应uid不为0
     * -4 - server err
     *
     * @since 10004
     * @param {object} params 参数
     * @param {string} params.did did
     * @param {object} params.props props 键值对， 属性需要以"prop.s_"开头
     * @example
     * let params = {'did':Device.deviceID, 'props': {
     *  "prop.s_notify_screen_dev_enable":"0", //0,关； 1，开
     *  "prop.s_notify_screen_dev_did":"123456789" // 接收rpc的音响设备
     * }}
     * Service.smarthome.setDeviceProp(params).then(...)
     */
    setDeviceProp(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/device/set_props", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    //@native begin
    batchGetDeviceProps(params) {
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/device/batchdevicedatas", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
    },
    //@native end
    /**
     * 从服务器获取配置文件，/device/getThirdConfig
     *
     * @param {json} params  -参数 {"name":"config_version","version":1,"lang":"en","app_id":"XXX"}
     * @param {string} params.name configName
     * @param {string} params.model device model
     * @param {string} params.app_id app_id
     * @param {string} params.lang lang e.g: zh_CN
     * @param {string} params.result_level 值为1，则不返回content来节省流量， 默认为0
     * @param {string} params.version version
     * @return {Promise}
     */
    getThirdConfig(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/device/getThirdConfig", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * /v2/third/synccall. 兼容三方厂商使用
     * @since 10003
     * @param {json} params {"uid": , "did":, "api_name": , ...}
     * @return {Promise<json>} {"code": 0, "policy": <POLICY_NUMBER">, ...}
     */
    thirdSyncCall(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/third/synccall", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 异步调用第三方云接口  /third/api
     *
     * @param {json} params  -参数 {"app_id":"123","dids":["1","2"],"params":json}
     * @return {Promise}
     */
    callThirdPartyAPI(params) {
        //@native :=> promise
        //这个接口在iOS原生下处于无人维护了，直接切换到纯JS使用
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/third/api", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                // 和 ios统一
                if (res.code !== undefined && res.code === 0 && res.result !== undefined) {
                    let result = res.result;
                    if (result.interval) {
                        let p = { "sid": result.sid, 'interval': result.interval }
                        this.callThirdApiResult(result, 1, 1, result.max_retry).then(r => {
                            resolve(r);
                        }).catch(e => {
                            reject(e);
                        });
                    } else {
                        resolve(result);
                    }
                } else {
                    reject(res);
                }
            });
        });
        //@native end
    },
    //@native begin
    callThirdApiResultWithCallBack(rsp, retryTime, realTime, max, that, callback) {
        rsp.retry_time = retryTime;
        native.MIOTRPC.nativeCall("/third/api_result", rsp, (ok, res) => {
            if (!ok) {
                if(native.isAndroid && res && res.code === -17){
                    console.log('On Android platform,code=-17,retry if necessary.');
                }else{
                    callback(ok, res);
                    return;
                }
            }
            if (res.code === 0 && res.result) {
                callback(ok, res.result);
            } else if (res.code === -17) {
                if (retryTime < max) {
                    let interval = rsp.interval;
                    interval = interval / 10.0 > 0.5 ? interval : 0.5;
                    interval = interval * Math.pow(2, (realTime - 1));
                    interval = interval > rsp.interval ? rsp.interval : interval;
                    let retryC = (interval < rsp.interval / 2.0 && realTime < 4) ? retryTime : retryTime + 1;
                    let realT = realTime + 1;
                    setTimeout(() => {
                        that.callThirdApiResultWithCallBack(rsp, retryC, realT, max, that, callback);
                    }, interval)
                } else {
                    callback(false, { "message": "client time out", code: -408 });
                }
            } else {
                callback(false, res);
            }
        });
    },
    callThirdApiResult(rsp, retryTime, realTime, max) {
        let that = this;
        return new Promise((resolve, reject) => {
            this.callThirdApiResultWithCallBack(rsp, retryTime, realTime, max, that, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            });
        });
    },
    //@native end
    /**
     * 华米watch配置使用
     * Android not support yet
     * @return {Promise}
     */
    getMiWatchConfig() {
        if (native.isAndroid) {
            return new Promise.reject("not support android yet");
        }
        return new Promise((resolve, reject) => {
            native.MIOTHost.getMiWatchConfigWithCallback((ok, res) => {
                if (ok) {
                    return resolve(res);
                }
                reject("get failed");
            });
        });
    },
    /**
     * 获取authCode来做鉴权
     * @param string} did 设备的 did
     * @returns {Promise}
     */
    getUserDeviceAuth(did) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/get_device_auth", { did }, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取InterimFileUrl 获取临时文件。文档请参考：https://iot.mi.com/new/doc/08-%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97/03-%E5%AD%98%E5%82%A8/01-%E4%BD%BF%E7%94%A8FDS%E5%AD%98%E5%82%A8%E7%94%A8%E6%88%B7%E6%96%87%E4%BB%B6.html#%E5%9B%9B%EF%BC%8Efds%E5%AD%98%E5%82%A8%E4%B8%B4%E6%97%B6%E6%96%87%E4%BB%B6%E7%9A%84%E4%B8%8A%E4%BC%A0%E4%B8%8B%E8%BD%BD%E6%B5%81%E7%A8%8B
     * @param {json} params  -参数 {obj_name : '{ownerId}/{deviceId}/{index}'}
     * @returns {Promise}
     */
    getInterimFileUrl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/home/get_interim_file_url", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 获取文件下载地址
     * @deprecated 10004 使用 Host.file.getFDSFileInfoWithObjName
     * @param {json} params  -参数 {obj_name : '2018/06/08/123456/xiaomi123_181030106.mp3'}
     * @return {Promise}
     */
    getFileUrl(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/home/getfileurl", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 日志分页拉取
     * @since 10001
     * @param {object} params 参数
     * @param {string} params.did
     * @param {string} params.key
     * @param {string} params.type
     * @param {number} params.timestamp
     * @param {number} params.limit
     * @return {Promise}
     */
    getUserDeviceDataTab(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/user/getuserdevicedatatab", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * /v2/home/range_get_open_config
     * 通过appid、category、configid获获取对应的配置，请参考文档文档：https://iot.mi.com/new/doc/08-%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97/03-%E5%AD%98%E5%82%A8/03-KV-OpenConfig.html
     * @since 10002
     * @param {json} params  -参数 {did,category,configids,offset,limit}
     * @return {Promise}
     */
    rangeGetOpenConfig(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/home/range_get_open_config", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 门锁米家APP上传Cid,Did,Uid，返回处理结果。函数内部与金服APP建立http连接签名传输配置信息与NFC卡片信息
     * Service.smarthome.BindNFCCard(params)
     * @since 10003
     * @param {json} params {did:'', uid:'', cid:''}
     */
    bindNFCCard(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/nfckey/bind_nfc_card", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * 米家app查询NFC卡信息，使用did查询did下绑定的NFC卡列表信息
     * @since 10003
     * @param {json} params {did:''}
     * @return {json}  卡片结果数组
     * @example
     * response:
     * ret={
        "code":0,
        "message":"ok",
        "result":{
            "list":[{
                "did":"1234567",
                "uid":123456789,                    //设备owner的用户id
                "cid":"111122223333444455",
                "name":"家",                            //用户设置的卡名称
                "type":1,                                  //卡片类型，1：手机NFC卡，2：实体卡
                "status":1,                               //卡片状态，1：有效， 0： 无效
                "issuer_id":"666666",
                "time_stamp":1234567890,   // 开卡时间
                "extra":{
                    "deviceModel":"RedMi 4X",
                    "OS":"MIUI 9.5"
                    }
                },
                {
                ...
                }
                ]
        }
    }
     */
    getNFCCard(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/nfckey/get_nfc_card", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * /yaokan/insertunmodel
     * @since 10004
     * @param {json} params {device:int, id: int, brand: string, model: string}
     */
    insertunmodel(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/yaokan/insertunmodel", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * call api /scene/idfy_get
     * @since 10005
     * @param {object} params json params
     * @param {string} params.indetify 唯一标识符，场景的id，一般填did
     * @example
     * let params = {identify:Device.deviceID}
     * Service.smarthome.getIDFY(params)
     */
    getIDFY(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/scene/idfy_get", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * call api /scene/idfy_get
     * @since 10005
     * @param {object} params json params
     * @example
     * let params = {"identify":"554011","st_id":7,"setting":{"aqi_link":"0","exception_alert":"1","blue_sky_alert":"0"},"authed":["554011"]}
     * Service.smarthome.editIDFY(params)
     */
    editIDFY(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/scene/idfy_edit", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * call api /v2/home/range_get_open_config
     * @since 10005
     * @deprecated 10011 改用 Service.smarthome.rangeGetOpenConfig
     * @param {json} params json params {did:string, category:string, configids:array, offset: int, limit:int}, did: 设备did。 category 配置类别， configids： 配置id 为空时返回所有配置，不超过20个，不为空时没有数量限制， offset 偏移；limit 数量，不超过20
     */
    getRangeOpenConfig(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/home/range_get_open_config", params, (ok, res) => {
                if (!ok) {
                    return reject(res);
                }
                resolve(res);
            });
        });
        //@native end
    },
    /**
     * @typedef MemberPet
     * @property {string} id
     * @property {string} name      名称
     * @property {string} sex       性别
     * @property {string} birth     生日
     * @property {double} weight    重量
     * @property {string} species   物种
     * @property {string} variety   品种
     * @property {string} food_cate 食品
     * @property {int} active_rate  活跃度
     * @property {int} castrated    阉割
     * @property {int} special_mark 特殊标志
     */
    /**
     * @typedef MemberPerson
     * @property {string} id
     * @property {string} name      姓名
     * @property {string} sex       性别
     * @property {string} birth     生日
     * @property {double} height    身高
     * @property {double} weight    体重
     * @property {string} relation  关系
     * @property {string} icon      预留项，暂不支持设置
     * @property {int} xiaomi_id    小米uid
     * @property {string} region    国家区域
     * @property {int} special_mark 特殊标志
     */
    /**
     * 创建 成员， 参考 MemberPerson 或者 MemberPet 的内容，按需填写。
     * @since 10005
     * @param {MemberType} type 成员类型 pet or person
     * @param {MemberPerson} info  - MemberPerson 或者 MemberPet
     */
    createMember(type, info) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/user/create_member", { type, info }, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 更新成员信息
     * @since 10005
     * @param {MemberType} type
     * @param {string} member_id
     * @param {MemberPerson} info - MemberPerson 或者 MemberPet 只填写需要更新的项目
     */
    updateMember(type, member_id, info) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/user/update_member", { type, member_id, info }, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 删除成员
     * @since 10005
     * @param {MemberType} type
     * @param {Array} member_id 成员id列表
     */
    deleteMember(type, member_id) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/user/remove_member", { type, member_id }, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 加载指定种类的成员列表
     * @since 10005
     * @param {MemberType} type
     */
    loadMembers(type) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/user/get_member", { type }, (ok, res) => {
                if (ok && res instanceof Array) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 设置用户信息
     * call /user/setpdata, 其中的time为关键信息，在getpdata使用时将利用此值。
     * @since 10010
     * @param {object} params params
     * @param {long} params.time setpddata的时间戳
     * @param {string} params.key key 字串
     * @param {string} params.value value值
     */
    setUserPDData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/setpdata", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 获取用户信息
     * call /user/getpdata
     * 此接口的时间戳范围是反的，即：time_start > time_end ,否则获取不到。
     * @since 10010
     * @param {object} params params
     * @param {object} params.time_end 筛选结果的时间戳
     * @param {object} params.time_start 筛选结果的时间戳
     * @param {object} params.key 获取的key
     */
    getUserPDData(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/user/getpdata", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * App获取设备上报操作记录
     * request /v2/user/get_device_data_raw
     * @since 10011
     * @param {object} params 参数
     * @param {string} params.did 设备did
     * @param {string} params.uid 用户UID
     * @param {string} params.type  查询事件；当查询属性时使用 'prop', 否则使用 'store'操作
     * @param {string} params.key   事件名称；当查询属性时value填具体属性，比如"aqi"
     * @param {string} params.time_start   开始UTC时间
     * @param {string} params.time_end 结束UTC时间
     * @param {string} params.limit    最多返回结果数目，上限500。注意按需填写，返回数据越多查询越慢
     */
    getDeviceDataRaw(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/user/get_device_data_raw", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 透传米家APP与小米支付创建session
     * request /v2/nfckey/create_se_session
     * @since 10011
     * @param {object} params params
     * @param {string} params.did did
     * @param {object} params.reqData // 透传给Mipay的数据
     * @param {string} params.reqData.userId // 透传给Mipay的数据
     * @param {string} params.reqData.cplc // 透传给Mipay的数据
     * @param {string} params.reqData.deviceType // 透传给Mipay的数据
     * @param {string} params.reqData.deviceId // 透传给Mipay的数据
     * @param {string} params.reqData.timestamp // 透传给Mipay的数据
     * @param {string} params.reqData.sign // 透传给Mipay的数据
     */
    createSeSession(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/nfckey/create_se_session", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 透传替换ISD key
     * request /v2/nfckey/replace_se_isdkey
     * @since 10011
     * @param {object} params params
     * @param {string} params.did did
     * @param {object} params.reqData // 透传给Mipay的数据
     * @param {string} params.reqData.sessionId // 透传给Mipay的数据
     * @param {string} params.reqData.partnerId // 透传给Mipay的数据
     * @param {string} params.reqData.userId // 透传给Mipay的数据
     * @param {string} params.reqData.cplc // 透传给Mipay的数据
     * @param {string} params.reqData.timestamp // 透传给Mipay的数据
     * @param {string} params.reqData.sign // 透传给Mipay的数据
     */
    replaceSEISDkey(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/nfckey/replace_se_isdkey", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 透传锁主密钥重置
     * request /v2/nfckey/reset_lock_primarykey
     * @since 10011
     * @param {object} params params
     * @param {string} params.did did
     * @param {object} params.reqData // 透传给Mipay的数据
     * @param {string} params.reqData.sessionId // 透传给Mipay的数据
     * @param {string} params.reqData.partnerId // 透传给Mipay的数据
     * @param {string} params.reqData.userId // 透传给Mipay的数据
     * @param {string} params.reqData.cplc // 透传给Mipay的数据
     * @param {string} params.reqData.timestamp // 透传给Mipay的数据
     * @param {string} params.reqData.sign // 透传给Mipay的数据
     */
    resetLockPrimaryKey(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/nfckey/reset_lock_primarykey", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 处理芯片返回
     * request /v2/nfckey/handle_se_response
     * @since 10011
     * @param {object} params params
     * @param {string} params.did did
     * @param {object} params.reqData // 透传给Mipay的数据
     * @param {string} params.reqData.sessionId // 透传给Mipay的数据
     * @param {string} params.reqData.userId // 透传给Mipay的数据
     * @param {string} params.reqData.cplc // 透传给Mipay的数据
     * @param {Array<object>} params.reqData.seResps // 这是一个数组透传给Mipay的数据
     * @param {string} params.reqData.seResps[].data // 这是一个透传给Mipay的数据
     * @param {string} params.reqData.seResps[].statusWord // 这是一个透传给Mipay的数据
     * @param {string} params.reqData.timestamp // 透传给Mipay的数据
     * @param {string} params.reqData.sign // 透传给Mipay的数据
     * @example
     * let param = {
     *  "did":"1234567",
     *  "reqData":{ // 透传给Mipay的数据
     *      "sessionId":"999999999",
     *      "userId":"12340000",
     *      "cplc":"asdghjklmnbvd",
     *      "seResps":[
     *          {"data":"","statusWord":"9000"},
     *          {"data":"","statusWord":"6A80"}
     *      ],
     *      "timestamp":1234567890,
     *      "sign":"shaddgkldsjlkeri"
     *  }
     * }
     */
    handleSEResponse(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.standardCall("/v2/nfckey/handle_se_response", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    },
    /**
     * 上报蓝牙设备信息
     * call: /v2/device/bledevice_info
     * 等效于: /v2/blemesh/dev_info
     * @since 10020
     * @param {object} params 参数
     * @param {string} prarms.did 设备did
     * @param {string} prarms.fw_ver 设备当前固件版本号
     * @param {string} prarms.hw_ver 设备的硬件平台
     * @param {string} prarms.latitude 纬度，number字符串
     * @param {string} prarms.longitude 经度，number字符串
     * @param {string} prarms.iternetip app/网关IP地址
     */
    reportBLEDeviceInfo(params) {
        //@native :=> promise
        return new Promise((resolve, reject) => {
            native.MIOTRPC.nativeCall("/v2/device/bledevice_info", params, (ok, res) => {
                if (ok) {
                    resolve(res);
                } else {
                    reject(res);
                }
            })
        })
        //@native end
    }
}