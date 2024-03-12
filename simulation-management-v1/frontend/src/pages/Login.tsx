import { Form, FormGroup, Label, Button, Card, CardBody } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import logo1Img from '../assets/images/logo-1.png';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { X } from 'react-feather';
import { useLoginUserMutation } from '../redux/api/authAPI';
import { getUserData } from '../utils/Utils';
import { LoginUserRequest } from '../redux/api/types';

const Login = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginUserRequest>();

    const [loginUser, { isLoading, isError, error, isSuccess }] = useLoginUserMutation();

    const navigate = useNavigate();

    const onSubmit = (data: LoginUserRequest) => {
        loginUser(data);
    };

    useEffect(() => {
        if (isSuccess) {
            const user = getUserData();
            const userInfo = JSON.parse(user);
            console.log(userInfo);
            toast(
                (t) => (
                    <div className="d-flex">
                        <div className="d-flex flex-column">
                            <div className="d-flex justify-content-between">
                                <h6>{userInfo.firstName}</h6>
                                <X size={12} className="cursor-pointer" onClick={() => toast.dismiss(t.id)} />
                            </div>
                            <span className="small">You have successfully logged in as an {userInfo.role} user. Enjoy!</span>
                        </div>
                    </div>
                ),
                {
                    duration: 4000,
                    position: 'top-right'
                }
            );
            navigate('/');
        }

        if (isError && error) {
            let errorMessage = (error as any).data.message;
            if (typeof errorMessage !== 'string') {
                errorMessage = 'An error occurred while logging in.';
            }
            toast.error(
                <div className="d-flex align-items-center">
                    <span className="toast-title">{errorMessage}</span>
                </div>,
                {
                    duration: 4000,
                    position: 'top-right'
                }
            );
        }
    }, [error, isError, isLoading, isSuccess, navigate]);

    return (
        <div className="auth-wrapper auth-v1 px-2 auth-background">
            <div className="auth-inner py-2">
                <Card className="mb-0">
                    <CardBody>
                        <div className="mb-4 d-flex justify-content-center">
                            <img className="logo" src={logo1Img} alt="SmartSitter" />
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <h1 className="heading-3 form-title">Login with your account</h1>
                            </div>
                        </div>

                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <FormGroup>
                                <Label>Username</Label>
                                <input
                                    className={`form-control ${classnames({ 'is-invalid': errors.username })}`}
                                    type="text"
                                    id="username"
                                    {...register('username', { required: true })}
                                />
                                {errors.username && <span className="text-danger">Username is required.</span>}
                            </FormGroup>
                            <FormGroup>
                                <Label>Password</Label>
                                <input
                                    className={`form-control ${classnames({ 'is-invalid': errors.password })}`}
                                    type="password"
                                    id="password"
                                    {...register('password', { required: true })}
                                />
                                {errors.password && <span className="text-danger">Password is required.</span>}
                            </FormGroup>
                            <div className="mt-4">
                                <Button color="danger" className="btn-block w-100" type="submit">
                                    LOGIN
                                </Button>
                            </div>
                            <div className="mt-4 d-flex justify-content-center">
                                <p>
                                    Not a member?  
                                    <Link to="/register" className="primary-link">
                                        <span>Register</span>
                                    </Link>{' '}
                                </p>
                            </div>
                        </Form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default Login;
