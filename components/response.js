"use strict";

exports.res200 = function (res, data = null) {
  var data = {
    message: "Operation success",
    data: data,
  };

  res.status(200);
  res.json(data);
  res.end();
};

exports.res404 = function (res, values = "Resources not found") {
  var data = {
    message: values,
  };

  res.status(404);
  res.json(data);
  res.end();
};

exports.res400 = function (
  res,
  values = "Request error. Please read the API documentation."
) {
  var data = {
    message: values,
  };

  res.status(400);
  res.json(data);
  res.end();
};

exports.res401 = function (res, values = "Unauthorized access.") {
  var data = {
    message: values,
  };

  res.status(401);
  res.json(data);
  res.end();
};

exports.res403 = function (
  res,
  values = "Forbidden. You're not allowed to access this resources."
) {
  var data = {
    message: values,
  };

  res.status(403);
  res.json(data);
  res.end();
};

exports.res500 = function (
  res,
  values = "Internal system failure. Please contact system administrator"
) {
  var data = {
    message: values,
  };

  res.status(500);
  res.json(data);
  res.end();
};

exports.res409 = function (res, values = "Resource/data already exists") {
  var data = {
    message: values,
  };

  res.status(409);
  res.json(data);
  res.end();
};

exports.res503 = function (
  res,
  values = "Service unavailable. Please contact system administrator."
) {
  var data = {
    message: values,
  };

  res.status(503);
  res.json(data);
  res.end();
};
