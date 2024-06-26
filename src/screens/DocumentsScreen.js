import {createStackNavigator} from '@react-navigation/stack';
import React, {useState} from 'react';
import {FlatList, RefreshControl, Text, View} from 'react-native';
import {usePaginatedQuery} from 'react-query';

import CommentThread from '../comments/CommentThread';
import Card from '../components/Card';
import Document from '../components/Document';
import ErrorDisplay from '../components/ErrorDisplay';
import NoSiteSelected from '../components/NoSiteSelected';
import Pagination from '../components/Pagination';
import ToggleDrawerButton from '../components/ToggleDrawerButton';
import {useAppState} from '../hooks/appState';
import useScrollToTop from '../hooks/useScrollToTop';
import gStyles from '../styles/main';
import {isNotEmptyString} from '../util/util';

const Documents = ({navigation}) => {
	const [state, , request] = useAppState();

	const {siteId} = state;

	const [page, setPage] = useState(1);

	const {error, refetch, resolvedData, status} = usePaginatedQuery(
		siteId && ['documents', siteId, page],
		() => {
			return request(
				`/o/headless-delivery/v1.0/sites/${siteId}/documents?flatten=true&sort=dateModified:desc&page=${page}&pageSize=20`
			);
		}
	);

	const flatList = useScrollToTop(resolvedData ? resolvedData.page : null);

	const items = resolvedData ? resolvedData.items : [];

	const renderItem = ({index, item}) => (
		<Card
			containerStyle={index === items.length - 1 ? gStyles.mb2 : null}
			imageUrl={item.adaptedImages[0]?.contentUrl}
			onPress={() => navigation.navigate('DocumentEntry', item)}
			title={item.title}
		>
			{isNotEmptyString(item.description) && (
				<Text>{item.description}</Text>
			)}
		</Card>
	);

	if (!siteId) {
		return <NoSiteSelected />;
	}

	return (
		<View style={{flex: 1}}>
			{items && (
				<FlatList
					ListHeaderComponent={
						<>
							{status === 'error' && (
								<ErrorDisplay
									error={error.message}
									onRetry={() => refetch()}
								/>
							)}

							{items &&
								items.length === 0 &&
								status === 'success' && (
									<Text
										style={[gStyles.m2, gStyles.textCenter]}
									>
										There are no documents to display.
									</Text>
								)}
						</>
					}
					data={items}
					keyExtractor={({id}) => id.toString()}
					ref={flatList}
					refreshControl={
						<RefreshControl
							onRefresh={() => refetch()}
							refreshing={status === 'loading'}
						/>
					}
					renderItem={(obj) => renderItem(obj)}
				/>
			)}

			{resolvedData && (
				<Pagination
					lastPage={resolvedData.lastPage}
					page={resolvedData.page}
					pageSize={resolvedData.pageSize}
					setPage={setPage}
					totalCount={resolvedData.totalCount}
				/>
			)}
		</View>
	);
};

const Stack = createStackNavigator();

function DocumentsNavigation({navigation}) {
	return (
		<Stack.Navigator
			initialRouteName="Documents"
			screenOptions={{
				headerRight: () => (
					<ToggleDrawerButton navigation={navigation} />
				),
			}}
		>
			<Stack.Screen
				component={Documents}
				name="DocumentsScreen"
				options={{title: 'Documents'}}
			/>
			<Stack.Screen
				component={Document}
				name="DocumentEntry"
				options={({route}) => {
					return {title: route.params.title};
				}}
			/>
			<Stack.Screen
				component={CommentThread}
				name="CommentThread"
				options={{
					headerTitle: 'Comment Thread',
				}}
			/>
		</Stack.Navigator>
	);
}

export default DocumentsNavigation;
