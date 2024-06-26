import { Form, FormGroup, Label, Button, Card, CardBody } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import logo1Img from '../assets/images/logo-1.png';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'react-feather';
import { LoginUserRequest } from '../redux/api/types';
import axios from 'axios';